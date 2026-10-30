import { OrderStatus } from "@prisma/client";
import { z } from "zod";

import { getPrisma } from "../db/prismaClient";
import { triggerLowStockAlertIfRequired } from "../services/inventory-alert.service";
import { triggerOrderConfirmationAlert } from "../services/customer-router.service";

const cjsModule = { exports: {} as Record<string, any> };
const exports = cjsModule.exports as Record<string, any>;
type OrderTotalsJson = { total?: unknown } | null;

const shippingSchema = z.object({
  fullName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  address: z.string().min(1),
  city: z.string().optional(),
  postalCode: z.string().optional(),
});

const orderItemSchema = z.object({
  id: z.string().optional(),
  productId: z.string().optional(),
  productImage: z.string().optional().nullable(),
  sku: z.string().optional(),
  shadeId: z.string().optional().nullable(),
  name: z.string().min(1),
  shade: z.string().optional().nullable(),
  shadeName: z.string().optional().nullable(),
  shadeImage: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  image: z.string().optional().nullable(),
  thumb: z.string().optional().nullable(),
  price: z.number().nonnegative(),
  currency: z.string().optional(),
  quantity: z.number().int().min(1),
});

const createOrderSchema = z.object({
  paymentMethod: z.string().max(64).optional(),
  totals: z.object({
    subtotal: z.number().nonnegative(),
    shippingFee: z.number().nonnegative(),
    total: z.number().nonnegative(),
  }),
  shipping: shippingSchema,
  items: z.array(orderItemSchema).min(1),
});

const orderStatusSchema = z.enum([
  "PENDING",
  "PAID",
  "FULFILLED",
  "PROCESSING",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
  "REJECTED",
]);

const updateOrderSchema = z.object({
  status: orderStatusSchema.optional(),
  shipping: shippingSchema.partial().optional(),
  trackingNumber: z.string().optional().nullable(),
  carrier: z.string().optional().nullable(),
});

const sanitizeOrder = (order: any) => {
  if (!order) return null;
  const shippingObj =
    typeof order.shipping === "object" && order.shipping !== null
      ? (order.shipping as Record<string, any>)
      : {};

  return {
    id: order.id,
    number: order.number,
    status: order.status,
    paymentMethod: order.paymentMethod,
    totals: order.totals,
    shipping: shippingObj,
    trackingNumber: shippingObj.trackingNumber || null,
    carrier: shippingObj.carrier || null,
    items: Array.isArray(order.items)
      ? order.items.map((item: any) => ({
          ...item,
          image: item?.image || item?.thumb || undefined,
          thumb: item?.thumb || item?.image || undefined,
          shade: item?.shade || item?.shadeName || undefined,
          shadeName: item?.shadeName || item?.shade || undefined,
          color: item?.color || undefined,
        }))
      : order.items,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    userId: order.userId,
    customer: order.user ? { id: order.user.id, name: order.user.name, email: order.user.email } : null,
  };
};

const createOrderNumber = () => `ORD-${Date.now().toString(36).toUpperCase()}`;
const getOrderRevenue = (totals: unknown) => Number((totals as OrderTotalsJson)?.total) || 0;
const isInProgressStatus = (status: OrderStatus) =>
  status !== OrderStatus.PENDING && status !== OrderStatus.DELIVERED;

async function adjustOrderInventory(prisma: any, items: any[], mode: "deduct" | "restore") {
  if (!Array.isArray(items) || !items.length) return;
  const factor = mode === "deduct" ? -1 : 1;

  for (const item of items) {
    const qty = Math.max(1, Number(item.quantity) || 1);
    const delta = factor * qty;

    try {
      let shade: any = null;

      // 1. Try finding shade by SKU
      if (item.sku && String(item.sku).trim() && String(item.sku) !== "0") {
        shade = await prisma.shade.findFirst({
          where: { sku: String(item.sku).trim() },
          include: { inventory: true },
        });
      }

      // 2. Try finding shade by shadeId
      if (!shade && item.shadeId) {
        shade = await prisma.shade.findUnique({
          where: { id: String(item.shadeId) },
          include: { inventory: true },
        });
      }

      // 3. Try finding shade by item.id if it is a shade ID
      if (!shade && item.id && !item.id.includes("_") && !item.id.includes("-")) {
        shade = await prisma.shade.findUnique({
          where: { id: String(item.id) },
          include: { inventory: true },
        });
      }

      // 4. Try finding shade by productId + shadeName
      const prodId = item.productId || (item.id && !item.id.includes("_") ? item.id : null);
      const shadeName = item.shadeName || item.shade;

      if (!shade && prodId && shadeName) {
        shade = await prisma.shade.findFirst({
          where: {
            productId: String(prodId),
            name: { equals: String(shadeName).trim(), mode: "insensitive" },
          },
          include: { inventory: true },
        });
      }

      // 5. Try finding shade by name if shadeName is unique
      if (!shade && shadeName) {
        shade = await prisma.shade.findFirst({
          where: {
            name: { equals: String(shadeName).trim(), mode: "insensitive" },
          },
          include: { inventory: true },
        });
      }

      // 6. Fallback to product's first shade if productId is known
      if (!shade && prodId) {
        shade = await prisma.shade.findFirst({
          where: { productId: String(prodId) },
          include: { inventory: true },
        });
      }

      if (shade) {
        if (shade.inventory) {
          const currentQty = Number(shade.inventory.quantity) || 0;
          const newQty = Math.max(0, currentQty + delta);
          await prisma.inventory.update({
            where: { id: shade.inventory.id },
            data: { quantity: newQty },
          });
        } else {
          const newQty = Math.max(0, delta > 0 ? delta : 0);
          await prisma.inventory.create({
            data: {
              shadeId: shade.id,
              quantity: newQty,
            },
          });
        }

        if (mode === "deduct") {
          triggerLowStockAlertIfRequired({
            productName: item.name || shade.name || "Cevonne Lipstick",
            shadeName: shade.name || item.shadeName || "Lipstick Shade",
            shadeCode: shade.sku || undefined,
            quantity: shade.inventory ? Math.max(0, (Number(shade.inventory.quantity) || 0) + delta) : Math.max(0, delta > 0 ? delta : 0),
          });
        }
      }
    } catch (err) {
      console.warn("Failed to adjust inventory for order item:", item?.name, err);
    }
  }
}

exports.createOrder = async (req, res, next) => {
  try {
    const payload = createOrderSchema.parse(req.body);
    const prisma = await getPrisma();

    // Validate that ordered items do not exceed available inventory in database
    for (const item of payload.items) {
      const requestedQty = Math.max(1, Number(item.quantity) || 1);
      let shade: any = null;

      if (item.sku && String(item.sku).trim() && String(item.sku) !== "0") {
        shade = await prisma.shade.findFirst({
          where: { sku: String(item.sku).trim() },
          include: { inventory: true },
        });
      }

      if (!shade && item.shadeId) {
        shade = await prisma.shade.findUnique({
          where: { id: String(item.shadeId) },
          include: { inventory: true },
        });
      }

      if (!shade && item.id && !item.id.includes("_") && !item.id.includes("-")) {
        shade = await prisma.shade.findUnique({
          where: { id: String(item.id) },
          include: { inventory: true },
        });
      }

      const prodId = item.productId || (item.id && !item.id.includes("_") ? item.id : null);
      const shadeName = item.shadeName || item.shade;

      if (!shade && prodId && shadeName) {
        shade = await prisma.shade.findFirst({
          where: {
            productId: String(prodId),
            name: { equals: String(shadeName).trim(), mode: "insensitive" },
          },
          include: { inventory: true },
        });
      }

      if (!shade && shadeName) {
        shade = await prisma.shade.findFirst({
          where: {
            name: { equals: String(shadeName).trim(), mode: "insensitive" },
          },
          include: { inventory: true },
        });
      }

      if (shade && shade.inventory) {
        const availableStock = Number(shade.inventory.quantity) || 0;
        if (availableStock <= 0) {
          return res.status(400).json({
            message: `"${item.name || shade.name || "Item"}" (${shade.name || "shade"}) is currently out of stock.`,
          });
        }
        if (requestedQty > availableStock) {
          return res.status(400).json({
            message: `Insufficient stock for "${item.name || shade.name}". Only ${availableStock} unit${availableStock === 1 ? "" : "s"} available in stock, but ${requestedQty} were requested.`,
          });
        }
      }
    }

    const order = await prisma.order.create({
      data: {
        number: createOrderNumber(),
        status: OrderStatus.PENDING,
        paymentMethod: payload.paymentMethod,
        totals: payload.totals,
        shipping: payload.shipping,
        items: payload.items,
        userId: req.user?.id,
      },
    });

    // Automatically deduct ordered quantity from inventory
    await adjustOrderInventory(prisma, payload.items, "deduct");

    // Asynchronously notify customer & team via n8n (WhatsApp + Email)
    triggerOrderConfirmationAlert({
      orderNumber: order.number,
      customerName: payload.shipping?.fullName || "Valued Customer",
      email: payload.shipping?.email,
      phone: payload.shipping?.phone,
      totalAmount: getOrderRevenue(payload.totals),
      items: (payload.items || []).map((it: any) => ({
        name: it.name,
        shade: it.shadeName || it.shade || it.color || "Shade",
        quantity: it.quantity || 1,
        price: it.price,
      })),
    });

    return res.status(201).json(sanitizeOrder(order));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.issues?.[0]?.message || "Invalid payload" });
    }
    return next(error);
  }
};

exports.getMyOrders = async (req, res, next) => {
  try {
    const prisma = await getPrisma();
    const orders = await prisma.order.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" },
    });
    return res.status(200).json(orders.map(sanitizeOrder));
  } catch (error) {
    return next(error);
  }
};

exports.getOrder = async (req, res, next) => {
  try {
    const id = req.params?.id;
    if (!id) {
      return res.status(400).json({ message: "Order identifier required" });
    }
    const prisma = await getPrisma();
    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id }, { number: id }],
      },
      include: {
        user: { select: { id: true, email: true, name: true } },
      },
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const authUser = req.user;
    if (authUser && authUser.role !== "ADMIN" && order.userId && order.userId !== authUser.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    return res.status(200).json(sanitizeOrder(order));
  } catch (error) {
    return next(error);
  }
};

exports.listOrders = async (_req, res, next) => {
  try {
    const prisma = await getPrisma();
    const orders = await prisma.order.findMany({
      include: { user: { select: { id: true, email: true, name: true } } },
      orderBy: { createdAt: "desc" },
    });

    const summary = {
      total: orders.length,
      pending: orders.filter((o) => o.status === OrderStatus.PENDING).length,
      inProgress: orders.filter((o) => isInProgressStatus(o.status)).length,
      delivered: orders.filter((o) => o.status === OrderStatus.DELIVERED).length,
      paid: orders.filter((o) => o.status === OrderStatus.PAID).length,
      fulfilled: orders.filter((o) => o.status === OrderStatus.DELIVERED).length,
      revenue: orders.reduce((acc, order) => acc + getOrderRevenue(order.totals), 0),
    };

    return res.status(200).json({
      items: orders.map((order) => ({
        ...sanitizeOrder(order),
        customer: order.user ? { id: order.user.id, name: order.user.name, email: order.user.email } : null,
      })),
      summary,
    });
  } catch (error) {
    return next(error);
  }
};

exports.updateOrder = async (req, res, next) => {
  try {
    const updates = updateOrderSchema.parse(req.body);
    if (!updates.status && !updates.shipping && updates.trackingNumber === undefined && updates.carrier === undefined) {
      return res.status(400).json({ message: "No updates provided" });
    }
    const prisma = await getPrisma();
    const existing = await prisma.order.findUnique({
      where: { id: req.params.id },
    });
    if (!existing) {
      return res.status(404).json({ message: "Order not found" });
    }

    const currentShipping =
      typeof existing.shipping === "object" && existing.shipping !== null
        ? (existing.shipping as Record<string, unknown>)
        : {};

    const updatedShipping = {
      ...currentShipping,
      ...(updates.shipping || {}),
      ...(updates.trackingNumber !== undefined ? { trackingNumber: updates.trackingNumber } : {}),
      ...(updates.carrier !== undefined ? { carrier: updates.carrier } : {}),
    };

    const newStatus = updates.status;
    const oldStatus = existing.status;

    // Check if transitioning to or from CANCELLED/REJECTED
    const isInactive = (s?: string | null) => s === "CANCELLED" || s === "REJECTED";
    const wasInactive = isInactive(oldStatus);
    const willBeInactive = isInactive(newStatus);

    const items = Array.isArray(existing.items) ? (existing.items as any[]) : [];

    if (!wasInactive && willBeInactive) {
      // Order is being rejected or cancelled -> RESTORE stock back to inventory!
      await adjustOrderInventory(prisma, items, "restore");
    } else if (wasInactive && !willBeInactive && newStatus) {
      // Order was re-opened from rejected/cancelled -> DEDUCT stock again!
      await adjustOrderInventory(prisma, items, "deduct");
    }

    let order: any;
    try {
      order = await prisma.order.update({
        where: { id: req.params.id },
        data: {
          status: updates.status || undefined,
          shipping: updatedShipping,
        },
        include: {
          user: { select: { id: true, email: true, name: true } },
        },
      });
    } catch (err: any) {
      if (
        updates.status &&
        (err?.message?.includes("OrderStatus") ||
          err?.message?.includes("Invalid value for argument `status`"))
      ) {
        // Fallback in case the in-memory Prisma Client runtime has not refreshed: execute direct DB update
        await prisma.$executeRawUnsafe(
          `UPDATE "Order" SET "status" = $1::"OrderStatus", "shipping" = $2::jsonb, "updatedAt" = NOW() WHERE "id" = $3`,
          updates.status,
          JSON.stringify(updatedShipping),
          req.params.id
        );
        order = await prisma.order.findUnique({
          where: { id: req.params.id },
          include: {
            user: { select: { id: true, email: true, name: true } },
          },
        });
      } else {
        throw err;
      }
    }
    return res.status(200).json(sanitizeOrder(order));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.issues?.[0]?.message || "Invalid payload" });
    }
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Order not found" });
    }
    return next(error);
  }
};


exports.checkCustomerRecoveryStatus = async (req: any, res: any, next: any) => {
  try {
    const email = (req.query?.email as string)?.trim().toLowerCase() || null;
    const phone = (req.query?.phone as string)?.trim() || null;

    if (!email && !phone) {
      return res.status(200).json({
        shouldSuppress: false,
        reason: null,
        hasPurchased: false,
        isOptedOut: false,
      });
    }

    const prisma = await getPrisma();

    // 1. Check if customer placed an order in the last 3 hours
    const recentOrders = await prisma.$queryRaw<Array<{ id: string; number: string; status: string }>>`
      SELECT id, number, status 
      FROM "Order" 
      WHERE (
        (${email}::text IS NOT NULL AND LOWER(shipping->>'email') = LOWER(${email}))
        OR
        (${phone}::text IS NOT NULL AND shipping->>'phone' = ${phone})
      )
      AND "createdAt" >= NOW() - INTERVAL '3 hours'
      LIMIT 1;
    `;

    if (recentOrders && recentOrders.length > 0) {
      return res.status(200).json({
        shouldSuppress: true,
        reason: "PURCHASE_COMPLETED",
        hasPurchased: true,
        orderNumber: recentOrders[0].number,
        isOptedOut: false,
      });
    }

    // 2. Check if customer has opted out ("STOP" / Unsubscribe)
    let isOptedOut = false;
    try {
      const optOut = await prisma.$queryRaw<Array<{ id: string }>>`
        SELECT id 
        FROM cevonne_g3_opt_out_sync 
        WHERE (
          (${email}::text IS NOT NULL AND LOWER(email) = LOWER(${email}))
          OR
          (${phone}::text IS NOT NULL AND phone = ${phone})
        )
        LIMIT 1;
      `;
      if (optOut && optOut.length > 0) isOptedOut = true;
    } catch {
      // Table may not have rows or is optional
    }

    if (isOptedOut) {
      return res.status(200).json({
        shouldSuppress: true,
        reason: "OPTED_OUT",
        hasPurchased: false,
        isOptedOut: true,
      });
    }

    return res.status(200).json({
      shouldSuppress: false,
      reason: null,
      hasPurchased: false,
      isOptedOut: false,
    });
  } catch (error) {
    return next(error);
  }
};


cjsModule.exports = {
  createOrder: exports.createOrder,
  getMyOrders: exports.getMyOrders,
  getOrder: exports.getOrder,
  listOrders: exports.listOrders,
  updateOrder: exports.updateOrder,
  checkCustomerRecoveryStatus: exports.checkCustomerRecoveryStatus,
};

export default cjsModule.exports;

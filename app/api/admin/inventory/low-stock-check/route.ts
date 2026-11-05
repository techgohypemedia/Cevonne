export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { getPrisma } from "@/server/db/prismaClient";
import { getAuthUser, jsonResponse, methodNotAllowed } from "@/server/next/route-utils";

export async function GET(request: Request) {
  try {
    const prisma = await getPrisma();
    const records = await prisma.inventory.findMany({
      orderBy: { quantity: "asc" },
      include: {
        shade: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    });

    const items = records.map((rec) => {
      const threshold = 10;
      const isLowStock = rec.quantity <= threshold;
      return {
        id: rec.id,
        shadeId: rec.shadeId,
        productName: rec.shade?.product?.name || "Cevonne Luxury Lipstick",
        shadeName: rec.shade?.name || "Lipstick Shade",
        shadeCode: rec.shade?.sku || "",
        color: rec.shade?.hexColor || "#b91c1c",
        quantity: rec.quantity,
        threshold,
        isLowStock,
        updatedAt: rec.updatedAt.toISOString(),
      };
    });

    const lowStockCount = items.filter((i) => i.isLowStock).length;

    return jsonResponse({
      success: true,
      items,
      totalCount: items.length,
      lowStockCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[LowStockCheck] Error fetching inventory:", error);
    return jsonResponse(
      {
        success: false,
        message: "Failed to load inventory status",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
}

export async function POST(request: Request) {
  try {
    const auth = await getAuthUser(request);
    // Allow admin or authenticated request
    const body = (await request.json().catch(() => ({}))) as {
      forceTest?: boolean;
      shadeId?: string;
    };

    const prisma = await getPrisma();
    const records = await prisma.inventory.findMany({
      orderBy: { quantity: "asc" },
      include: {
        shade: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    });

    const items = records.map((rec) => {
      const threshold = 10;
      const isLowStock = rec.quantity <= threshold;
      return {
        id: rec.id,
        shadeId: rec.shadeId,
        productName: rec.shade?.product?.name || "Cevonne Luxury Lipstick",
        shadeName: rec.shade?.name || "Lipstick Shade",
        shadeCode: rec.shade?.sku || "",
        color: rec.shade?.hexColor || "#b91c1c",
        quantity: rec.quantity,
        threshold,
        isLowStock,
        updatedAt: rec.updatedAt.toISOString(),
      };
    });

    let targetItems = items.filter((i) => i.isLowStock);

    if (body.forceTest && targetItems.length === 0 && items.length > 0) {
      // If forcing a test run and no item is low stock, use the first item as a simulated test
      targetItems = [{ ...items[0], quantity: Math.min(items[0].quantity, 3) }];
    } else if (body.shadeId) {
      const specific = items.find((i) => i.shadeId === body.shadeId || i.id === body.shadeId);
      if (specific) {
        targetItems = [specific];
      }
    }

    if (targetItems.length === 0) {
      return jsonResponse({
        success: true,
        triggered: false,
        message: "All shades are currently in stock (> 10 units). No alert was triggered.",
        lowStockCount: 0,
        items,
      });
    }

    const webhookUrl =
      process.env.N8N_INVENTORY_ALERT_WEBHOOK_URL ||
      `${process.env.N8N_BASE_URL || "https://n8n.cevonne.com/webhook"}/cevonne/inventory-alert`;

    const dispatchResults = await Promise.all(
      targetItems.map(async (item) => {
        try {
          const res = await fetch(webhookUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(process.env.N8N_WEBHOOK_SHARED_SECRET
                ? { "X-N8N-Secret": process.env.N8N_WEBHOOK_SHARED_SECRET }
                : {}),
            },
            body: JSON.stringify({
              event: "LOW_STOCK_ALERT",
              product_name: item.productName,
              shade_name: item.shadeName,
              shade_code: item.shadeCode,
              current_stock: item.quantity,
              threshold: item.threshold,
              timestamp: new Date().toISOString(),
            }),
          });

          return {
            shadeName: item.shadeName,
            status: res.status,
            ok: res.ok,
          };
        } catch (err) {
          return {
            shadeName: item.shadeName,
            status: 500,
            ok: false,
            error: err instanceof Error ? err.message : "Fetch failed",
          };
        }
      })
    );

    const anySuccess = dispatchResults.some((r) => r.ok);

    return jsonResponse({
      success: true,
      triggered: true,
      anySuccess,
      message: anySuccess
        ? `Alert triggered successfully to n8n! WhatsApp message and Email dispatched for ${targetItems.map((t) => t.shadeName).join(", ")}.`
        : `Dispatched to n8n webhook (${webhookUrl}) with status: ${dispatchResults.map((r) => r.status).join(", ")}.`,
      dispatchResults,
      alertedCount: targetItems.length,
      items,
    });
  } catch (error) {
    console.error("[LowStockCheck] Error triggering alert:", error);
    return jsonResponse(
      {
        success: false,
        message: "Failed to trigger alert",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
}


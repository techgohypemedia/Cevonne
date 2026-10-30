const fs = require('fs');

// 1. Update order.controller.ts
const ctrlPath = 'server/controllers/order.controller.ts';
let ctrlContent = fs.readFileSync(ctrlPath, 'utf8');

const weeklyMetricsCode = `
exports.getWeeklyBusinessMetrics = async (_req, res, next) => {
  try {
    const prisma = await getPrisma();
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Format readable date range
    const formatDate = (d) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    const dateRange = \`\${formatDate(sevenDaysAgo)} – \${formatDate(now)}\`;

    // Fetch orders in last 7 days
    const orders = await prisma.order.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      orderBy: { createdAt: "desc" },
    });

    const isNonCancelled = (s) => s !== "CANCELLED" && s !== "REJECTED";
    const nonCancelledOrders = orders.filter((o) => isNonCancelled(o.status));

    const totalRevenue = nonCancelledOrders.reduce((sum, o) => sum + getOrderRevenue(o.totals), 0);
    const totalOrders = orders.length;
    const aov = totalOrders > 0 ? Math.round(totalRevenue / (nonCancelledOrders.length || 1)) : 0;

    const deliveredCount = orders.filter((o) => o.status === OrderStatus.DELIVERED).length;
    const shippedCount = orders.filter((o) => o.status === OrderStatus.SHIPPED).length;
    const processingCount = orders.filter((o) => o.status === OrderStatus.PROCESSING || o.status === OrderStatus.PAID).length;
    const pendingCount = orders.filter((o) => o.status === OrderStatus.PENDING).length;
    const cancelledCount = orders.filter((o) => !isNonCancelled(o.status)).length;

    // Tally top products/shades
    const productTally = {};
    for (const o of nonCancelledOrders) {
      const items = Array.isArray(o.items) ? o.items : [];
      for (const item of items) {
        const key = item.shadeName || item.shade || item.name || "Unknown Product";
        const qty = Number(item.quantity) || 1;
        const price = Number(item.price) || 0;
        if (!productTally[key]) {
          productTally[key] = { name: key, quantity: 0, revenue: 0 };
        }
        productTally[key].quantity += qty;
        productTally[key].revenue += price * qty;
      }
    }

    const topProducts = Object.values(productTally)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 3);

    // Critical inventory items (stock <= 10)
    let criticalItems = [];
    try {
      const invRows = await prisma.inventory.findMany({
        where: { stock: { lte: 10 } },
        include: { product: true, shade: true },
        take: 5,
        orderBy: { stock: "asc" },
      });
      criticalItems = invRows.map((row) => ({
        product: row.product?.name || "Product",
        shade: row.shade?.name || "Standard",
        stock: row.stock,
      }));
    } catch {
      criticalItems = [];
    }

    return res.status(200).json({
      status: "SUCCESS",
      period: "Last 7 Days",
      dateRange,
      summary: {
        totalRevenue,
        totalOrders,
        aov,
        deliveredCount,
        shippedCount,
        processingCount,
        pendingCount,
        cancelledCount,
      },
      topProducts,
      inventoryWatch: {
        criticalCount: criticalItems.length,
        items: criticalItems,
      },
      generatedAt: now.toISOString(),
    });
  } catch (error) {
    return next(error);
  }
};
`;

if (!ctrlContent.includes('exports.getWeeklyBusinessMetrics')) {
  const insertBeforeExport = 'cjsModule.exports = {';
  ctrlContent = ctrlContent.replace(insertBeforeExport, weeklyMetricsCode + '\n\n' + insertBeforeExport);
  ctrlContent = ctrlContent.replace('checkCouponStatus: exports.checkCouponStatus,', 'checkCouponStatus: exports.checkCouponStatus,\n  getWeeklyBusinessMetrics: exports.getWeeklyBusinessMetrics,');
  fs.writeFileSync(ctrlPath, ctrlContent, 'utf8');
  console.log('Added getWeeklyBusinessMetrics to order.controller.ts');
}

// 2. Update orders.ts
const apiPath = 'server/next/api/orders.ts';
let apiContent = fs.readFileSync(apiPath, 'utf8');

if (!apiContent.includes('weekly-metrics')) {
  const target = 'if ((first === "check-coupon" || first === "check-coupons") && request.method === "GET") {';
  const dispatchCode = `if (first === "weekly-metrics" && request.method === "GET") {
    return runController(request, orderController.getWeeklyBusinessMetrics);
  }

  `;
  apiContent = apiContent.replace(target, dispatchCode + target);
  fs.writeFileSync(apiPath, apiContent, 'utf8');
  console.log('Added weekly-metrics route to orders.ts');
}


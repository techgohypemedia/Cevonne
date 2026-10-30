const fs = require('fs');

const ctrlPath = 'server/controllers/order.controller.ts';
let content = fs.readFileSync(ctrlPath, 'utf8');

// 1. Fix `let reason = null;` -> `let reason: string | null = null;`
content = content.replace('let reason = null;', 'let reason: string | null = null;');

// 2. Fix `getWeeklyBusinessMetrics` implementation with proper types
const oldCodeStart = 'exports.getWeeklyBusinessMetrics = async (_req, res, next) => {';
const oldCodeEnd = 'return res.status(200).json({\n      status: "SUCCESS",\n      period: "Last 7 Days"';

const properCode = `exports.getWeeklyBusinessMetrics = async (_req: any, res: any, next: any) => {
  try {
    const prisma = await getPrisma();
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const formatDate = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    const dateRange = \`\${formatDate(sevenDaysAgo)} – \${formatDate(now)}\`;

    const orders = await prisma.order.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      orderBy: { createdAt: "desc" },
    });

    const isNonCancelled = (s?: string | null) => s !== "CANCELLED" && s !== "REJECTED";
    const nonCancelledOrders = orders.filter((o) => isNonCancelled(o.status));

    const totalRevenue = nonCancelledOrders.reduce((sum, o) => sum + getOrderRevenue(o.totals), 0);
    const totalOrders = orders.length;
    const aov = totalOrders > 0 ? Math.round(totalRevenue / (nonCancelledOrders.length || 1)) : 0;

    const deliveredCount = orders.filter((o) => o.status === OrderStatus.DELIVERED).length;
    const shippedCount = orders.filter((o) => o.status === OrderStatus.SHIPPED).length;
    const processingCount = orders.filter((o) => o.status === OrderStatus.PROCESSING || o.status === OrderStatus.PAID).length;
    const pendingCount = orders.filter((o) => o.status === OrderStatus.PENDING).length;
    const cancelledCount = orders.filter((o) => !isNonCancelled(o.status)).length;

    const productTally: Record<string, { name: string; quantity: number; revenue: number }> = {};
    for (const o of nonCancelledOrders) {
      const items = Array.isArray(o.items) ? (o.items as any[]) : [];
      for (const item of items) {
        if (!item) continue;
        const key = String(item.shadeName || item.shade || item.name || "Unknown Product");
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

    let criticalItems: Array<{ product: string; shade: string; stock: number }> = [];
    try {
      const invRows = await prisma.inventory.findMany({
        where: { quantity: { lte: 10 } },
        take: 5,
        orderBy: { quantity: "asc" },
      });

      const shadeIds = invRows.map((r) => r.shadeId).filter(Boolean);
      const shades = shadeIds.length > 0 ? await prisma.shade.findMany({
        where: { id: { in: shadeIds } },
        include: { product: true },
      }) : [];

      const shadeMap = new Map(shades.map((s) => [s.id, s]));

      criticalItems = invRows.map((row) => {
        const shade = shadeMap.get(row.shadeId);
        return {
          product: shade?.product?.name || "Lipstick",
          shade: shade?.name || "Standard",
          stock: row.quantity,
        };
      });
    } catch {
      criticalItems = [];
    }
`;

const startIndex = content.indexOf(oldCodeStart);
const endIndex = content.indexOf(oldCodeEnd);

if (startIndex !== -1 && endIndex !== -1) {
  content = content.substring(0, startIndex) + properCode + '\n    ' + content.substring(endIndex);
  fs.writeFileSync(ctrlPath, content, 'utf8');
  console.log('Successfully fixed TypeScript types in order.controller.ts');
} else {
  console.error('Could not find slice to replace');
}


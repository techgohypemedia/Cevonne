const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const [orderCount, recentOrders, lowStockItems] = await Promise.all([
    prisma.order.count(),
    prisma.order.findMany({ take: 5, orderBy: { createdAt: 'desc' } }),
    prisma.inventory.findMany({ where: { stock: { lte: 25 } }, include: { product: true, shade: true } })
  ]);

  console.log('Total Orders in DB:', orderCount);
  if (recentOrders.length > 0) {
    console.log('Recent Order Sample:', JSON.stringify(recentOrders[0], null, 2));
  }
  console.log('Low Stock Items (<25):', lowStockItems.map(i => `${i.product.name} (${i.shade?.name || 'Standard'}): ${i.stock}`));
  await prisma.$disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});


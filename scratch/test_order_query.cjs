const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  try {
    const count = await prisma.order.count();
    console.log('Order count:', count);
  } catch (e) {
    console.error('Error counting orders:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}
main();


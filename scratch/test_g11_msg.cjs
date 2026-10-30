const fs = require('fs');
const wf = JSON.parse(fs.readFileSync('scratch/g11_weekly_founder_digest.json', 'utf8'));
const codeNode = wf.nodes.find(n => n.name === 'Code - Build Founder Digest');

const mockInput = {
  json: {
    status: 'SUCCESS',
    dateRange: '24 Oct 2026 – 30 Oct 2026',
    summary: {
      totalRevenue: 24950,
      totalOrders: 18,
      aov: 1386,
      deliveredCount: 12,
      shippedCount: 4,
      processingCount: 2,
      pendingCount: 0,
      cancelledCount: 0
    },
    topProducts: [
      { name: 'Rose Blush', quantity: 24, revenue: 14376 },
      { name: 'Classic Scarlet', quantity: 16, revenue: 9584 },
      { name: 'Velvet Nude', quantity: 8, revenue: 4792 }
    ],
    inventoryWatch: {
      criticalCount: 1,
      items: [
        { product: 'Cevonne Matte Lipstick', shade: 'Velvet Nude', stock: 4 }
      ]
    }
  }
};

const $input = { first: () => mockInput };
const evalFn = new Function('$input', codeNode.parameters.jsCode);
const result = evalFn($input);
console.log('--- PREVIEW OF FOUNDER WHATSAPP MESSAGE ---');
console.log(result[0].json.digest_message);
console.log('-------------------------------------------');


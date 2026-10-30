const fs = require('fs');
const file = 'server/next/api/orders.ts';
let content = fs.readFileSync(file, 'utf8');

const target = 'if (first === "track" && request.method === "GET") {';
const addition = `if ((first === "check-recovery-status" || first === "check-recent") && request.method === "GET") {
    return runController(request, orderController.checkCustomerRecoveryStatus);
  }

  `;

content = content.replace(target, addition + target);
fs.writeFileSync(file, content, 'utf8');
console.log('Successfully updated server/next/api/orders.ts');


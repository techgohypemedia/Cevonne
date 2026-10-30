const fs = require('fs');
const file = 'server/next/api/orders.ts';
let content = fs.readFileSync(file, 'utf8');

const target = 'if ((first === "check-recovery-status" || first === "check-recent") && request.method === "GET") {';
const addition = `if ((first === "check-coupon" || first === "check-coupons") && request.method === "GET") {
    return runController(request, orderController.checkCouponStatus);
  }

  `;

content = content.replace(target, addition + target);
fs.writeFileSync(file, content, 'utf8');
console.log('Successfully patched server/next/api/orders.ts with check-coupon route');


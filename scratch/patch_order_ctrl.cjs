const fs = require('fs');
const file = 'server/controllers/order.controller.ts';
let content = fs.readFileSync(file, 'utf8');

const codeToInsert = `
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
    const recentOrders = await prisma.$queryRaw<Array<{ id: string; number: string; status: string }>>\`
      SELECT id, number, status 
      FROM "Order" 
      WHERE (
        (\${email}::text IS NOT NULL AND LOWER(shipping->>'email') = LOWER(\${email}))
        OR
        (\${phone}::text IS NOT NULL AND shipping->>'phone' = \${phone})
      )
      AND "createdAt" >= NOW() - INTERVAL '3 hours'
      LIMIT 1;
    \`;

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
      const optOut = await prisma.$queryRaw<Array<{ id: string }>>\`
        SELECT id 
        FROM cevonne_g3_opt_out_sync 
        WHERE (
          (\${email}::text IS NOT NULL AND LOWER(email) = LOWER(\${email}))
          OR
          (\${phone}::text IS NOT NULL AND phone = \${phone})
        )
        LIMIT 1;
      \`;
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
`;

content = content.replace(
  /cjsModule\.exports\s*=\s*\{([^}]+)\};/,
  (match, p1) => {
    return `${codeToInsert}\n\ncjsModule.exports = {${p1}  checkCustomerRecoveryStatus: exports.checkCustomerRecoveryStatus,\n};`;
  }
);

fs.writeFileSync(file, content, 'utf8');
console.log('Successfully updated order.controller.ts');


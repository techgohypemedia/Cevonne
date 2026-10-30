const fs = require('fs');
const file = 'server/controllers/order.controller.ts';
let content = fs.readFileSync(file, 'utf8');

const codeToInsert = `
exports.checkCouponStatus = async (req: any, res: any, next: any) => {
  try {
    const code = (req.query?.code as string)?.trim().toUpperCase() || null;
    const prisma = await getPrisma();
    const now = new Date();
    const in48Hours = new Date(Date.now() + 48 * 60 * 60 * 1000);

    // If specific code queried:
    if (code) {
      const discount = await prisma.cevonne_discounts.findFirst({
        where: { code },
      });

      if (!discount) {
        return res.status(200).json({
          code,
          exists: false,
          isActive: false,
          status: "NOT_FOUND",
          reason: "Coupon code does not exist in store",
        });
      }

      const isExpired = discount.ends_at ? new Date(discount.ends_at) <= now : false;
      const notStarted = discount.starts_at ? new Date(discount.starts_at) > now : false;
      const limitReached = discount.usage_limit_total
        ? discount.used_count >= discount.usage_limit_total
        : false;

      const isActive = discount.status === "ACTIVE" && !isExpired && !notStarted && !limitReached;

      let reason = null;
      if (!isActive) {
        if (discount.status !== "ACTIVE") reason = \`Coupon status is \${discount.status}\`;
        else if (isExpired) reason = "Coupon has expired";
        else if (notStarted) reason = "Coupon has not started yet";
        else if (limitReached) reason = "Coupon usage limit reached";
      }

      return res.status(200).json({
        code: discount.code,
        exists: true,
        isActive,
        status: discount.status,
        discountType: discount.discount_type,
        discountValue: discount.discount_value,
        startsAt: discount.starts_at,
        endsAt: discount.ends_at,
        isExpired,
        limitReached,
        usedCount: discount.used_count,
        usageLimitTotal: discount.usage_limit_total,
        reason,
      });
    }

    // Default mode: Return expiring or risky active coupons (expiring in next 48 hrs or limit nearly reached)
    const activeDiscounts = await prisma.cevonne_discounts.findMany({
      where: {
        status: "ACTIVE",
        archived_at: null,
      },
      select: {
        code: true,
        discount_type: true,
        discount_value: true,
        starts_at: true,
        ends_at: true,
        status: true,
        used_count: true,
        usage_limit_total: true,
      },
    });

    const expiringSoon: Array<any> = [];
    const limitReachedList: Array<any> = [];

    for (const d of activeDiscounts) {
      if (d.ends_at && new Date(d.ends_at) <= in48Hours) {
        const hoursLeft = Math.max(0, Math.round((new Date(d.ends_at).getTime() - now.getTime()) / (1000 * 60 * 60)));
        expiringSoon.push({
          code: d.code,
          discountValue: d.discount_value,
          discountType: d.discount_type,
          endsAt: d.ends_at,
          hoursLeft,
          isAlreadyExpired: hoursLeft === 0,
        });
      }

      if (d.usage_limit_total && d.used_count >= d.usage_limit_total) {
        limitReachedList.push({
          code: d.code,
          usedCount: d.used_count,
          limit: d.usage_limit_total,
        });
      }
    }

    const hasWarnings = expiringSoon.length > 0 || limitReachedList.length > 0;

    return res.status(200).json({
      hasWarnings,
      totalActiveCoupons: activeDiscounts.length,
      expiringSoon,
      limitReachedList,
      checkedAt: now.toISOString(),
    });
  } catch (error) {
    return next(error);
  }
};
`;

content = content.replace(
  /checkCustomerRecoveryStatus:\s*exports\.checkCustomerRecoveryStatus,/,
  'checkCustomerRecoveryStatus: exports.checkCustomerRecoveryStatus,\n  checkCouponStatus: exports.checkCouponStatus,'
);

// Insert before cjsModule.exports
content = content.replace(
  /cjsModule\.exports\s*=\s*\{/,
  `${codeToInsert}\n\ncjsModule.exports = {`
);

fs.writeFileSync(file, content, 'utf8');
console.log('Successfully patched order.controller.ts with checkCouponStatus');


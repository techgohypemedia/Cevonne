const fs = require('fs');

// 1. Update order.controller.ts
const ctrlPath = 'server/controllers/order.controller.ts';
let ctrlContent = fs.readFileSync(ctrlPath, 'utf8');

const optOutCode = `
exports.recordOptOut = async (req: any, res: any, next: any) => {
  try {
    const body = req.body || {};
    const phone = (body.phone as string)?.trim() || null;
    const email = (body.email as string)?.trim().toLowerCase() || null;
    const keyword = (body.keyword as string)?.trim().toUpperCase() || "STOP";
    const channel = (body.channel as string)?.trim().toUpperCase() || "WHATSAPP";

    if (!phone && !email) {
      return res.status(400).json({ status: "ERROR", message: "Phone or email is required to opt-out" });
    }

    const prisma = await getPrisma();

    // Check if already opted out
    const existing = await prisma.cevonne_g3_opt_out_sync.findFirst({
      where: {
        OR: [
          ...(phone ? [{ phone }] : []),
          ...(email ? [{ email }] : []),
        ],
      },
    });

    if (existing) {
      return res.status(200).json({
        status: "SUCCESS",
        message: "Contact is already opted out",
        alreadyOptedOut: true,
        phone,
        email,
      });
    }

    await prisma.cevonne_g3_opt_out_sync.create({
      data: {
        phone,
        email,
        channel,
        opt_out_keyword: keyword,
        source_platform: channel,
        source_event: "CUSTOMER_OPT_OUT",
        payload: {
          keyword,
          channel,
          timestamp: new Date().toISOString(),
          actor: "customer_inbound",
        },
      },
    });

    return res.status(200).json({
      status: "SUCCESS",
      message: "Customer successfully opted out. Future automated marketing messages blocked.",
      alreadyOptedOut: false,
      phone,
      email,
      optedOutAt: new Date().toISOString(),
    });
  } catch (error) {
    return next(error);
  }
};
`;

if (!ctrlContent.includes('exports.recordOptOut')) {
  const target = 'cjsModule.exports = {';
  ctrlContent = ctrlContent.replace(target, optOutCode + '\n\n' + target);
  ctrlContent = ctrlContent.replace('getWeeklyBusinessMetrics: exports.getWeeklyBusinessMetrics,', 'getWeeklyBusinessMetrics: exports.getWeeklyBusinessMetrics,\n  recordOptOut: exports.recordOptOut,');
  fs.writeFileSync(ctrlPath, ctrlContent, 'utf8');
  console.log('Added recordOptOut to order.controller.ts');
}

// 2. Update orders.ts
const apiPath = 'server/next/api/orders.ts';
let apiContent = fs.readFileSync(apiPath, 'utf8');

if (!apiContent.includes('record-opt-out')) {
  const target = 'if (first === "weekly-metrics" && request.method === "GET") {';
  const dispatchCode = `if (first === "record-opt-out" && request.method === "POST") {
    const body = await readJsonBody(request);
    if (body instanceof Response) return body;
    return runController(request, orderController.recordOptOut, { body });
  }

  `;
  apiContent = apiContent.replace(target, dispatchCode + target);
  fs.writeFileSync(apiPath, apiContent, 'utf8');
  console.log('Added record-opt-out route to orders.ts');
}


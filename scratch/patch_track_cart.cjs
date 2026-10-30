const fs = require('fs');

// 1. Update order.controller.ts
const ctrlPath = 'server/controllers/order.controller.ts';
let ctrlContent = fs.readFileSync(ctrlPath, 'utf8');

const trackCartCode = `
exports.trackAbandonedCart = async (req: any, res: any, next: any) => {
  try {
    const body = req.body || {};
    const email = (body.email as string)?.trim().toLowerCase() || "";
    const phone = (body.phone as string)?.trim() || "";
    const customerName = (body.customerName as string)?.trim() || (body.fullName as string)?.trim() || "there";
    const items = Array.isArray(body.items) ? body.items : [];

    if (!email && !phone) {
      return res.status(400).json({ status: "ERROR", message: "Email or phone is required to track abandoned cart." });
    }

    const { triggerAbandonedCartAlert } = await import("../services/customer-router.service");
    await triggerAbandonedCartAlert({
      email,
      phone,
      customerName,
      items: items.map((i: any) => ({
        name: i.name || i.title || "Lipstick",
        shade: i.shadeName || i.shade || "Selected Shade",
        quantity: Number(i.quantity) || 1,
      })),
    });

    return res.status(200).json({ status: "SUCCESS", message: "Abandoned cart event dispatched to n8n router" });
  } catch (error) {
    return next(error);
  }
};
`;

if (!ctrlContent.includes('exports.trackAbandonedCart')) {
  const target = 'cjsModule.exports = {';
  ctrlContent = ctrlContent.replace(target, trackCartCode + '\n\n' + target);
  ctrlContent = ctrlContent.replace('recordOptOut: exports.recordOptOut,', 'recordOptOut: exports.recordOptOut,\n  trackAbandonedCart: exports.trackAbandonedCart,');
  fs.writeFileSync(ctrlPath, ctrlContent, 'utf8');
  console.log('Added trackAbandonedCart to order.controller.ts');
}

// 2. Update orders.ts
const apiPath = 'server/next/api/orders.ts';
let apiContent = fs.readFileSync(apiPath, 'utf8');

if (!apiContent.includes('track-abandoned-cart')) {
  const target = 'if (first === "record-opt-out" && request.method === "POST") {';
  const dispatchCode = `if (first === "track-abandoned-cart" && request.method === "POST") {
    const body = await readJsonBody(request);
    if (body instanceof Response) return body;
    return runController(request, orderController.trackAbandonedCart, { body });
  }

  `;
  apiContent = apiContent.replace(target, dispatchCode + target);
  fs.writeFileSync(apiPath, apiContent, 'utf8');
  console.log('Added track-abandoned-cart route to orders.ts');
}


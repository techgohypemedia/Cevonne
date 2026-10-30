const fs = require('fs');
const wf = JSON.parse(fs.readFileSync('scratch/customer_router_workflow.json', 'utf8'));

// 1. Add Check Customer Status node
const checkNode = {
  parameters: {
    method: "GET",
    url: "=https://cevonne.vercel.app/api/orders/check-recovery-status?email={{ ($json.body || $json).email }}&phone={{ ($json.body || $json).phone }}",
    options: {
      response: {
        response: {
          neverError: true
        }
      }
    }
  },
  id: "check-recovery-status-id",
  name: "Check Customer Purchase Status",
  type: "n8n-nodes-base.httpRequest",
  typeVersion: 4.2,
  position: [
    800,
    550
  ]
};

// 2. Add IF node: Should Suppress?
const ifSuppressNode = {
  parameters: {
    conditions: {
      options: {
        caseSensitive: true,
        leftValue: "",
        typeValidation: "strict",
        version: 2
      },
      conditions: [
        {
          id: "suppress-condition-1",
          leftValue: "={{ $json.shouldSuppress }}",
          rightValue: true,
          operator: {
            type: "boolean",
            operation: "equals"
          }
        }
      ],
      combinator: "and"
    },
    options: {}
  },
  id: "if-should-suppress-id",
  name: "Already Purchased or Opted Out?",
  type: "n8n-nodes-base.if",
  typeVersion: 2.2,
  position: [
    1020,
    550
  ]
};

// 3. Add Suppressed Note Node
const suppressLogNode = {
  parameters: {
    jsCode: `// Cart recovery suppressed safely because customer placed an order or opted out
const checkResult = $input.first().json;
const cart = $('Wait 30 Minutes').first().json;
const d = cart.body || cart;

return [{
  json: {
    status: 'SUPPRESSED',
    reason: checkResult.reason || 'PURCHASE_COMPLETED',
    customer: d.customerName || d.email || d.phone,
    orderNumber: checkResult.orderNumber || null,
    message: 'Recovery message suppressed. Customer will NOT be spammed.'
  }
}];`
  },
  id: "suppressed-log-id",
  name: "Recovery Suppressed (No Spam)",
  type: "n8n-nodes-base.code",
  typeVersion: 2,
  position: [
    1260,
    420
  ]
};

// 4. Update Format Cart Recovery to read from Wait 30 Minutes directly
const formatRecoveryNode = wf.nodes.find(n => n.name === 'Format Cart Recovery');
formatRecoveryNode.position = [1260, 680];
formatRecoveryNode.parameters.jsCode = `const cart = $('Wait 30 Minutes').first().json;
const d = cart.body || cart;
const customerName = d.customerName || d.fullName || 'there';
const customerPhone = d.phone || '';
const customerEmail = d.email || '';
const checkoutUrl = 'https://cevonne.vercel.app/cart';

const whatsappMessage = 
\`💄 *Aapka shade cart me wait kar raha hai!* ✨\\n\\n\` +
\`Hey \${customerName},\\n\` +
\`Aapne Cevonne cart me lipstick select ki thi par checkout complete nahi kiya.\\n\\n\` +
\`Aapke cart par humne *FREE SHIPPING* unlock kar di hai! 🎁\\n\\n\` +
\`Abhi apna order complete karein:\\n\` +
\`👉 \${checkoutUrl}\\n\\n\` +
\`_Limited stock available._\`;

const emailHtml = \`
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; background-color: #0b0b0b; color: #fff; border-radius: 12px; overflow: hidden;">
    <div style="background: linear-gradient(135deg, #be123c, #fb7185); padding: 30px 20px; text-align: center;">
      <h2 style="margin: 0; color: #fff;">Did you forget something gorgeous? 💋</h2>
    </div>
    <div style="padding: 24px;">
      <p>Hey <strong>\${customerName}</strong>,</p>
      <p style="color: #ccc; line-height: 1.6;">Your favorite Cevonne shade is reserved in your cart, but stock is running out fast.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="\${checkoutUrl}" style="background-color: #e11d48; color: #fff; padding: 14px 28px; text-decoration: none; border-radius: 9999px; font-weight: bold;">Complete My Order &rarr;</a>
      </div>
    </div>
  </div>
\`;

return [{
  json: {
    ...d,
    customer_phone: customerPhone.replace(/[^0-9]/g, ''),
    customer_email: customerEmail,
    whatsapp_message: whatsappMessage,
    email_subject: "Your Cevonne cart is waiting (Free Shipping Unlocked! 💄)",
    email_html: emailHtml
  }
}];`;

// Move WhatsApp and Email nodes to the right to look neat
const recoveryWa = wf.nodes.find(n => n.name === 'Send Recovery WhatsApp');
if (recoveryWa) recoveryWa.position = [1500, 600];
const recoveryEmail = wf.nodes.find(n => n.name === 'Send Recovery Email');
if (recoveryEmail) recoveryEmail.position = [1500, 780];

// Add nodes
wf.nodes.push(checkNode, ifSuppressNode, suppressLogNode);

// Rewire connections
// Wait 30 Minutes -> Check Customer Purchase Status
wf.connections["Wait 30 Minutes"] = {
  main: [
    [
      {
        node: "Check Customer Purchase Status",
        type: "main",
        index: 0
      }
    ]
  ]
};

// Check Customer Purchase Status -> Already Purchased or Opted Out?
wf.connections["Check Customer Purchase Status"] = {
  main: [
    [
      {
        node: "Already Purchased or Opted Out?",
        type: "main",
        index: 0
      }
    ]
  ]
};

// Already Purchased or Opted Out?:
// output 0 (true): Recovery Suppressed (No Spam)
// output 1 (false): Format Cart Recovery
wf.connections["Already Purchased or Opted Out?"] = {
  main: [
    [
      {
        node: "Recovery Suppressed (No Spam)",
        type: "main",
        index: 0
      }
    ],
    [
      {
        node: "Format Cart Recovery",
        type: "main",
        index: 0
      }
    ]
  ]
};

fs.writeFileSync('scratch/customer_router_workflow_with_suppression.json', JSON.stringify(wf, null, 2), 'utf8');
console.log('Saved upgraded workflow with suppression!');


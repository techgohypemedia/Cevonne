const fs = require('fs');

const workflow = {
  "name": "Cevonne - Ad Coupon Health & Expiry Monitor",
  "nodes": [
    {
      "parameters": {
        "rule": {
          "interval": [
            {
              "field": "cronExpression",
              "expression": "0 9 * * *"
            }
          ]
        }
      },
      "id": "coupon-schedule-trigger",
      "name": "Every Morning at 9 AM",
      "type": "n8n-nodes-base.scheduleTrigger",
      "typeVersion": 1.2,
      "position": [
        260,
        340
      ]
    },
    {
      "parameters": {
        "method": "GET",
        "url": "https://cevonne.vercel.app/api/orders/check-coupon",
        "options": {
          "response": {
            "response": {
              "neverError": true
            }
          }
        }
      },
      "id": "http-check-coupon",
      "name": "Fetch Coupon Health from Website",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [
        480,
        340
      ]
    },
    {
      "parameters": {
        "conditions": {
          "options": {
            "caseSensitive": true,
            "leftValue": "",
            "typeValidation": "strict",
            "version": 2
          },
          "conditions": [
            {
              "id": "coupon-has-warnings",
              "leftValue": "={{ $json.hasWarnings }}",
              "rightValue": true,
              "operator": {
                "type": "boolean",
                "operation": "equals"
              }
            }
          ],
          "combinator": "and"
        },
        "options": {}
      },
      "id": "if-coupon-warning",
      "name": "Any Coupon Expiring Soon?",
      "type": "n8n-nodes-base.if",
      "typeVersion": 2.2,
      "position": [
        720,
        340
      ]
    },
    {
      "parameters": {
        "jsCode": "const data = $input.first().json;\nconst expiring = data.expiringSoon || [];\nconst limited = data.limitReachedList || [];\n\nlet warningLines = [];\n\nexpiring.forEach(c => {\n  if (c.isAlreadyExpired) {\n    warningLines.push(`• ❌ *${c.code}* (${c.discountValue}% OFF) ALREADY EXPIRED!`);\n  } else {\n    warningLines.push(`• ⏳ *${c.code}* (${c.discountValue}% OFF) expires in *${c.hoursLeft} hours*!`);\n  }\n});\n\nlimited.forEach(c => {\n  warningLines.push(`• 🛑 *${c.code}* reached usage limit (${c.usedCount}/${c.limit})!`);\n});\n\nconst listText = warningLines.join('\\n');\n\nconst whatsappMessage = \n`⚠️ *Cevonne Ad Coupon Alert!* 🏷️\\n\\n` +\n`Dhyan dein, ye coupon codes jaldi band hone wale hain:\\n\\n` +\n`${listText}\\n\\n` +\n`👉 *Action Needed:* Agar in coupons par Meta/Instagram Ads chal rahe hain, toh please Dashboard me jaakar date extend karein taaki aapka Ad Spend waste na ho!\\n\\n` +\n`🔗 https://cevonne.vercel.app/dashboard/discounts\\n\\n` +\n`_Automated by Cevonne Guard_ 🛡️`;\n\nreturn [{\n  json: {\n    hasWarnings: true,\n    whatsapp_message: whatsappMessage,\n    recipient_phone: '917061009669'\n  }\n}];"
      },
      "id": "code-format-coupon-alert",
      "name": "Format Coupon WhatsApp Alert",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [
        960,
        240
      ]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "https://graph.facebook.com/v21.0/1269614229578624/messages",
        "authentication": "genericCredentialType",
        "genericAuthType": "httpHeaderAuth",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "Content-Type",
              "value": "application/json"
            }
          ]
        },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={{ { messaging_product: 'whatsapp', recipient_type: 'individual', to: $json.recipient_phone, type: 'text', text: { preview_url: true, body: $json.whatsapp_message } } }}",
        "options": {
          "response": {
            "response": {
              "neverError": true
            }
          }
        }
      },
      "id": "http-send-coupon-whatsapp",
      "name": "Send WhatsApp Alert to Owner",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [
        1200,
        240
      ],
      "credentials": {
        "httpHeaderAuth": {
          "id": "0BqY5nZ1yQn3o7j1",
          "name": "Meta Cloud API Header"
        }
      }
    },
    {
      "parameters": {
        "jsCode": "return [{\n  json: {\n    status: 'ALL_HEALTHY',\n    message: 'All active coupons are safe and valid. No coupon expiring in the next 48 hours.',\n    checked_at: new Date().toISOString()\n  }\n}];"
      },
      "id": "code-all-coupons-healthy",
      "name": "All Coupons Healthy (No Action)",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [
        960,
        440
      ]
    }
  ],
  "connections": {
    "Every Morning at 9 AM": {
      "main": [
        [
          {
            "node": "Fetch Coupon Health from Website",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Fetch Coupon Health from Website": {
      "main": [
        [
          {
            "node": "Any Coupon Expiring Soon?",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Any Coupon Expiring Soon?": {
      "main": [
        [
          {
            "node": "Format Coupon WhatsApp Alert",
            "type": "main",
            "index": 0
          }
        ],
        [
          {
            "node": "All Coupons Healthy (No Action)",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Format Coupon WhatsApp Alert": {
      "main": [
        [
          {
            "node": "Send WhatsApp Alert to Owner",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
};

fs.writeFileSync('scratch/ad_coupon_monitor_workflow.json', JSON.stringify(workflow, null, 2), 'utf8');
console.log('Saved scratch/ad_coupon_monitor_workflow.json');


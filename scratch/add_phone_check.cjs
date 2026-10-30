const fs = require('fs');
const wf = JSON.parse(fs.readFileSync('scratch/customer_router_workflow_with_suppression.json', 'utf8'));

// 1. Add "Has Order Phone?" IF node
const hasOrderPhoneNode = {
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
          id: "has-phone-cond-1",
          leftValue: "={{ ($json.customer_phone || '').length }}",
          rightValue: 10,
          operator: {
            type: "number",
            operation: "gte"
          }
        }
      ],
      combinator: "and"
    },
    options: {}
  },
  id: "if-has-order-phone-id",
  name: "Has Order Phone?",
  type: "n8n-nodes-base.if",
  typeVersion: 2.2,
  position: [
    980,
    100
  ]
};

// 2. Add "Has Recovery Phone?" IF node
const hasRecoveryPhoneNode = {
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
          id: "has-phone-cond-2",
          leftValue: "={{ ($json.customer_phone || '').length }}",
          rightValue: 10,
          operator: {
            type: "number",
            operation: "gte"
          }
        }
      ],
      combinator: "and"
    },
    options: {}
  },
  id: "if-has-recovery-phone-id",
  name: "Has Recovery Phone?",
  type: "n8n-nodes-base.if",
  typeVersion: 2.2,
  position: [
    1500,
    600
  ]
};

// Reposition nodes
const orderWa = wf.nodes.find(n => n.name === 'Send Order WhatsApp');
if (orderWa) orderWa.position = [1240, 100];

const orderEmail = wf.nodes.find(n => n.name === 'Send Order Email');
if (orderEmail) orderEmail.position = [980, 260];

const recoveryWa = wf.nodes.find(n => n.name === 'Send Recovery WhatsApp');
if (recoveryWa) recoveryWa.position = [1740, 600];

const recoveryEmail = wf.nodes.find(n => n.name === 'Send Recovery Email');
if (recoveryEmail) recoveryEmail.position = [1500, 780];

// Add nodes
wf.nodes.push(hasOrderPhoneNode, hasRecoveryPhoneNode);

// Update connections:
// Format Order Confirmation -> Has Order Phone? AND Send Order Email
wf.connections["Format Order Confirmation"] = {
  main: [
    [
      {
        node: "Has Order Phone?",
        type: "main",
        index: 0
      },
      {
        node: "Send Order Email",
        type: "main",
        index: 0
      }
    ]
  ]
};

// Has Order Phone? (output 0 / true) -> Send Order WhatsApp
wf.connections["Has Order Phone?"] = {
  main: [
    [
      {
        node: "Send Order WhatsApp",
        type: "main",
        index: 0
      }
    ]
  ]
};

// Format Cart Recovery -> Has Recovery Phone? AND Send Recovery Email
wf.connections["Format Cart Recovery"] = {
  main: [
    [
      {
        node: "Has Recovery Phone?",
        type: "main",
        index: 0
      },
      {
        node: "Send Recovery Email",
        type: "main",
        index: 0
      }
    ]
  ]
};

// Has Recovery Phone? (output 0 / true) -> Send Recovery WhatsApp
wf.connections["Has Recovery Phone?"] = {
  main: [
    [
      {
        node: "Send Recovery WhatsApp",
        type: "main",
        index: 0
      }
    ]
  ]
};

fs.writeFileSync('scratch/customer_router_workflow_smart_phone.json', JSON.stringify(wf, null, 2), 'utf8');
console.log('Saved smart workflow with phone routing!');


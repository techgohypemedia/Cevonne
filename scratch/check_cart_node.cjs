const fs = require('fs');
const wf = JSON.parse(fs.readFileSync('scratch/customer_router_workflow.json', 'utf8'));
const cartNode = wf.nodes.find(n => n.name === 'Format Cart Recovery');
console.log('Parameters:', JSON.stringify(cartNode.parameters, null, 2));


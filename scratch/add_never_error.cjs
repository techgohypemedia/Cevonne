const fs = require('fs');
const wf = JSON.parse(fs.readFileSync('scratch/customer_router_workflow_smart_phone.json', 'utf8'));

['Send Order WhatsApp', 'Send Recovery WhatsApp'].forEach(name => {
  const node = wf.nodes.find(n => n.name === name);
  if (node) {
    node.parameters.options = {
      response: {
        response: {
          neverError: true
        }
      }
    };
  }
});

fs.writeFileSync('scratch/customer_router_workflow_smart_phone.json', JSON.stringify(wf, null, 2), 'utf8');
console.log('Added neverError to WhatsApp nodes.');


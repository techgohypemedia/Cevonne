const fs = require('fs');
let content = fs.readFileSync('scratch/customer_router_workflow.json', 'utf8');
const fenceEnd = content.indexOf('```\n\n---');
if (fenceEnd !== -1) {
  content = content.slice(0, fenceEnd).trim();
}
const start = content.indexOf('{');
const end = content.lastIndexOf('}');
content = content.slice(start, end + 1);
const wf = JSON.parse(content);
fs.writeFileSync('scratch/customer_router_workflow.json', JSON.stringify(wf, null, 2), 'utf8');
console.log('Parsed successfully! Nodes:', wf.nodes.map(n => n.name));

const fs = require('fs');
let content = fs.readFileSync('scratch/customer_router_workflow.json', 'utf8');
console.log(content.slice(11950, 12100));


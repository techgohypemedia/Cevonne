const fs = require('fs');
const transcript = fs.readFileSync('C:/Users/GHM/.gemini/antigravity/brain/fdc76515-14f1-43f6-bc6e-28c1dec9dece/.system_generated/logs/transcript_full.jsonl', 'utf8');
const lines = transcript.split('\n');
const line138 = JSON.parse(lines[138]);
const content = line138.content || '';
const start = content.indexOf('{');
const end = content.lastIndexOf('}');
if (start !== -1 && end !== -1) {
  const jsonStr = content.slice(start, end + 1);
  fs.writeFileSync('scratch/customer_router_workflow.json', jsonStr, 'utf8');
  console.log('Saved to scratch/customer_router_workflow.json');
} else {
  console.log('No JSON found on line 138');
}


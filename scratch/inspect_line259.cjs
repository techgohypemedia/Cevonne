const fs = require('fs');
const transcript = fs.readFileSync('C:/Users/GHM/.gemini/antigravity/brain/fdc76515-14f1-43f6-bc6e-28c1dec9dece/.system_generated/logs/transcript_full.jsonl', 'utf8');
const lines = transcript.split('\n');
const line259 = JSON.parse(lines[259]);
console.log('type:', line259.type);
console.log('content sample:', (line259.content || '').slice(0, 400));


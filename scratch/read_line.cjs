const fs = require('fs');
const transcript = fs.readFileSync('C:/Users/GHM/.gemini/antigravity/brain/fdc76515-14f1-43f6-bc6e-28c1dec9dece/.system_generated/logs/transcript.jsonl', 'utf8');
const lines = transcript.split('\n');
const line260 = JSON.parse(lines[260]);
console.log('Type:', line260.type);
const text = line260.content || '';
// Find nodes relating to suppression
console.log(text.slice(0, 1000));


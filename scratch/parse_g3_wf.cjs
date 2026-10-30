const fs = require('fs');
const transcript = fs.readFileSync('C:/Users/GHM/.gemini/antigravity/brain/fdc76515-14f1-43f6-bc6e-28c1dec9dece/.system_generated/logs/transcript_full.jsonl', 'utf8');
const lines = transcript.split('\n');
for (let i = lines.length - 1; i >= 0; i--) {
  if (lines[i].includes('bhai mai tjhe uske n8n workflow de rha hu')) {
    const l = JSON.parse(lines[i]);
    console.log('Keys:', Object.keys(l));
    const str = typeof l.content === 'string' ? l.content : JSON.stringify(l);
    console.log('Sample:', str.slice(0, 300));
    break;
  }
}

const fs = require('fs');
const transcript = fs.readFileSync('C:/Users/GHM/.gemini/antigravity/brain/fdc76515-14f1-43f6-bc6e-28c1dec9dece/.system_generated/logs/transcript_full.jsonl', 'utf8');
const lines = transcript.split('\n');
for (let i = lines.length - 1; i >= 0; i--) {
  if (lines[i].includes('bhai mai tjhe uske n8n workflow de rha hu')) {
    const l = JSON.parse(lines[i]);
    const content = l.content || '';
    const matches = content.match(/"type":\s*"([^"]+)"/g);
    console.log('Types in G3:', Array.from(new Set(matches)));
    break;
  }
}

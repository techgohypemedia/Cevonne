const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8');
const lines = env.split('\n');
for (const line of lines) {
  if (line.startsWith('DATABASE_URL=')) {
    const val = line.slice('DATABASE_URL='.length).trim().replace(/^["']|["']$/g, '');
    try {
      const u = new URL(val);
      console.log('Database Host:', u.host);
      console.log('Database Name:', u.pathname);
    } catch (e) {
      console.log('Parse error:', e.message);
    }
  }
}


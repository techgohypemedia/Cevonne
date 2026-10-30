const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8');
function getVal(k) {
  const lines = env.split('\n');
  for (const line of lines) {
    if (line.startsWith(k + '=')) {
      return line.slice(k.length + 1).trim().replace(/^["']|["']$/g, '');
    }
  }
  return null;
}
const url = getVal('SUPABASE_URL');
const key = getVal('SUPABASE_SERVICE_ROLE_KEY');

async function check() {
  try {
    const res = await fetch(`${url}/rest/v1/?apikey=${key}`);
    const data = await res.json();
    if (data && data.definitions) {
      console.log('PostgREST Tables:', Object.keys(data.definitions).filter(t => 
        t.toLowerCase().includes('order') || 
        t.toLowerCase().includes('g3') || 
        t.toLowerCase().includes('suppress')
      ));
    } else {
      console.log('No definitions in response');
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}
check();

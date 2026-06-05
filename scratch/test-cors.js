import fs from 'fs';

// Read .env manually
const env = {};
try {
  const content = fs.readFileSync('.env', 'utf8');
  content.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
      env[parts[0].trim()] = parts.slice(1).join('=').trim();
    }
  });
} catch (e) {
  console.error('Failed to read .env', e);
}

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

async function test() {
  // We can query Supabase using native fetch
  const resDb = await fetch(`${supabaseUrl}/rest/v1/gallery_items?select=src&limit=1`, {
    headers: {
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`
    }
  });
  const data = await resDb.json();
  if (!data || data.length === 0) {
    console.log('No items in database');
    return;
  }
  const url = data[0].src;
  console.log('Testing URL:', url);
  
  // Make a request with Origin header to simulate browser fetch
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Origin': 'https://illustration-portfolio.vercel.app'
    }
  });
  console.log('Status:', res.status);
  console.log('Access-Control-Allow-Origin:', res.headers.get('access-control-allow-origin'));
  console.log('All Headers:', [...res.headers.entries()]);
}

test();

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

const accountId = env.CLOUDFLARE_ACCOUNT_ID;
const apiToken = env.CLOUDFLARE_API_TOKEN;
const bucketName = env.CLOUDFLARE_R2_BUCKET || 'gallery';
const publicUrlBase = env.CLOUDFLARE_R2_PUBLIC_URL;

async function test() {
  let allObjects = [];
  let cursor = null;
  let hasMore = true;

  while (hasMore) {
    let url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets/${bucketName}/objects`;
    if (cursor) {
      url += `?cursor=${encodeURIComponent(cursor)}`;
    }

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${apiToken}`
      }
    });

    const data = await response.json();
    if (data.result && Array.isArray(data.result)) {
      allObjects = allObjects.concat(data.result);
    }
    if (data.result_info && data.result_info.is_truncated) {
      cursor = data.result_info.cursor;
    } else {
      hasMore = false;
    }
  }

  const cleanBase = publicUrlBase.endsWith('/') ? publicUrlBase.slice(0, -1) : publicUrlBase;

  console.log(`Testing fetch for ${allObjects.length} files...`);
  for (const obj of allObjects) {
    const fileUrl = `${cleanBase}/${obj.key}`;
    try {
      const res = await fetch(fileUrl, {
        method: 'GET',
        headers: {
          'Origin': 'https://illustration-portfolio.vercel.app'
        }
      });
      console.log(`Key: ${obj.key.padEnd(45)} | Status: ${res.status} | CORS Allow-Origin: ${res.headers.get('access-control-allow-origin')}`);
    } catch (e) {
      console.log(`Key: ${obj.key.padEnd(45)} | Fetch Error: ${e.message}`);
    }
  }
}

test();

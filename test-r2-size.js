import fs from 'fs';
const envContent = fs.readFileSync('.env', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  if (line && !line.startsWith('#')) {
    const [k, ...v] = line.split('=');
    if (k) env[k.trim()] = v.join('=').trim();
  }
});

const accountId = env.CLOUDFLARE_ACCOUNT_ID;
const apiToken = env.CLOUDFLARE_API_TOKEN;
const bucketName = env.CLOUDFLARE_R2_BUCKET || 'gallery';

const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets/${bucketName}/objects`;

fetch(url, {
  headers: {
    'Authorization': `Bearer ${apiToken}`
  }
})
.then(r => r.json())
.then(data => {
  console.log(JSON.stringify(data, null, 2));
});

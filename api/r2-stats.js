import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // CORS setup
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Security: Check Authorization Header
  const authHeader = req.headers.authorization;
  const apiSecret = process.env.ADMIN_API_SECRET || '7263';
  if (!authHeader || authHeader !== `Bearer ${apiSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  const bucketName = process.env.CLOUDFLARE_R2_BUCKET || 'gallery';

  if (!accountId || !apiToken) {
    return res.status(500).json({ error: 'Server misconfigured: missing environment variables.' });
  }

  try {
    let totalSize = 0;
    let cursor = null;
    let hasMore = true;

    // Fetch all objects to calculate total size
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

      if (!response.ok) {
        throw new Error(`Cloudflare API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error('Cloudflare API returned success=false');
      }

      if (data.result && Array.isArray(data.result)) {
        data.result.forEach(obj => {
          totalSize += obj.size;
        });
      }

      if (data.result_info && data.result_info.is_truncated) {
        cursor = data.result_info.cursor;
      } else {
        hasMore = false;
      }
    }

    return res.status(200).json({ 
      success: true, 
      totalSizeBytes: totalSize,
      totalSizeGB: (totalSize / (1024 * 1024 * 1024)).toFixed(4)
    });

  } catch (err) {
    console.error("Handler error:", err);
    return res.status(500).json({ error: 'Internal server error processing stats' });
  }
}

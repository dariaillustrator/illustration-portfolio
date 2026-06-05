import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  // CORS setup
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id, src } = req.body;

  if (!id || !src) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  const bucketName = process.env.CLOUDFLARE_R2_BUCKET || 'gallery';

  if (!supabaseUrl || !supabaseServiceKey || !accountId || !apiToken) {
    return res.status(500).json({ error: 'Server misconfigured: missing environment variables.' });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Delete from Supabase Database
    console.log(`Deleting database record ${id} from Supabase...`);
    const { error: dbError } = await supabase
      .from('gallery_items')
      .delete()
      .eq('id', id);

    if (dbError) {
      throw new Error(`Supabase Database delete failed: ${dbError.message}`);
    }

    // 2. Delete from Cloudflare R2
    const isR2Url = src.includes('r2.dev') || src.includes(accountId);

    if (isR2Url) {
      const urlParts = src.split('/');
      const filename = urlParts[urlParts.length - 1];
      
      const r2Url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets/${bucketName}/objects/${filename}`;
      console.log(`Deleting ${filename} from Cloudflare R2...`);
      
      const r2Res = await fetch(r2Url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${apiToken}`
        }
      });

      if (!r2Res.ok) {
        const errorText = await r2Res.text();
        console.warn(`Cloudflare R2 delete returned non-ok status: ${r2Res.status} ${errorText}`);
      } else {
        const r2Data = await r2Res.json();
        if (!r2Data.success) {
          console.warn(`Cloudflare R2 delete returned success=false: ${JSON.stringify(r2Data.errors)}`);
        } else {
          console.log(`Deleted ${filename} from Cloudflare R2 successfully.`);
        }
      }
    } else {
      console.log(`URL ${src} is not an R2 URL, skipped R2 deletion.`);
    }

    return res.status(200).json({ success: true });

  } catch (err) {
    console.error("Handler error:", err);
    return res.status(500).json({ error: err.message });
  }
}

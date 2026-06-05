import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  // CORS setup
  res.setHeader('Access-Control-Allow-Origin', '*'); // Restricted by Auth
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Security: Check Authorization Header
  const authHeader = req.headers.authorization;
  const apiSecret = process.env.ADMIN_API_SECRET || '7263';
  if (!authHeader || authHeader !== `Bearer ${apiSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Security: Check Content-Type
  if (!req.headers['content-type']?.includes('application/json')) {
    return res.status(400).json({ error: 'Content-Type must be application/json' });
  }

  const { id, src } = req.body;

  if (!id || !src) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  // Security: Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return res.status(400).json({ error: 'Invalid ID format' });
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
      // Parse the URL to get the clean pathname and query parameters
      const parsedUrl = new URL(src);
      const pathnameParts = parsedUrl.pathname.split('/');
      const cleanFilename = pathnameParts[pathnameParts.length - 1];
      const oext = parsedUrl.searchParams.get('oext');

      // Helper to delete an object from R2
      const deleteObjectFromR2 = async (targetFilename) => {
        const r2Url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets/${bucketName}/objects/${targetFilename}`;
        console.log(`Deleting ${targetFilename} from Cloudflare R2...`);
        const r2Res = await fetch(r2Url, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${apiToken}`
          }
        });

        if (!r2Res.ok) {
          const errorText = await r2Res.text();
          console.warn(`Cloudflare R2 delete returned non-ok status for ${targetFilename}: ${r2Res.status} ${errorText}`);
          return false;
        } else {
          const r2Data = await r2Res.json();
          if (!r2Data.success) {
            console.warn(`Cloudflare R2 delete returned success=false for ${targetFilename}: ${JSON.stringify(r2Data.errors)}`);
            return false;
          } else {
            console.log(`Deleted ${targetFilename} from Cloudflare R2 successfully.`);
            return true;
          }
        }
      };

      // 1. Delete optimized image
      await deleteObjectFromR2(cleanFilename);

      // 2. Delete original high-quality image if it exists
      const baseName = cleanFilename.split('.')[0];
      const originalExt = oext || 'jpg';
      const originalFilename = `original_${baseName}.${originalExt}`;
      await deleteObjectFromR2(originalFilename);
    } else {
      console.log(`URL ${src} is not an R2 URL, skipped R2 deletion.`);
    }

    return res.status(200).json({ success: true });

  } catch (err) {
    console.error("Handler error:", err);
    // Return generic error to client, avoiding internal details leakage
    return res.status(500).json({ error: 'Internal server error processing deletion' });
  }
}

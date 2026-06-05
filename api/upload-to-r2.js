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

  const { image, filename, title, aspect_ratio, hue, saturation, lightness, is_parked } = req.body;

  if (!image || !filename || aspect_ratio === undefined || hue === undefined || saturation === undefined || lightness === undefined) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  // Security: Prevent path traversal by sanitizing filename
  if (!/^[a-zA-Z0-9_.-]+$/.test(filename)) {
    return res.status(400).json({ error: 'Invalid filename' });
  }

  // Security: Payload size limit (e.g., 5MB)
  const estimatedSize = (image.length * 3) / 4;
  if (estimatedSize > 5 * 1024 * 1024) {
    return res.status(413).json({ error: 'Payload too large (limit 5MB)' });
  }

  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  const bucketName = process.env.CLOUDFLARE_R2_BUCKET || 'gallery';
  const publicUrlBase = process.env.CLOUDFLARE_R2_PUBLIC_URL;

  if (!supabaseUrl || !supabaseServiceKey || !accountId || !apiToken || !publicUrlBase) {
    return res.status(500).json({ error: 'Server misconfigured: missing environment variables.' });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Decode base64 image data
    const buffer = Buffer.from(image, 'base64');

    // 2. Upload to Cloudflare R2 via REST API
    const r2Url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets/${bucketName}/objects/${filename}`;
    
    // Determine Content-Type from extension
    const ext = filename.split('.').pop().toLowerCase();
    const mimeTypes = {
      'png': 'image/png',
      'webp': 'image/webp',
      'gif': 'image/gif',
      'svg': 'image/svg+xml'
    };
    const contentType = mimeTypes[ext] || 'image/jpeg';

    console.log(`Uploading ${filename} to Cloudflare R2...`);
    const r2Res = await fetch(r2Url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': contentType
      },
      body: buffer
    });

    if (!r2Res.ok) {
      const errorText = await r2Res.text();
      throw new Error(`Cloudflare R2 upload failed: ${r2Res.status} ${errorText}`);
    }

    const r2Data = await r2Res.json();
    if (!r2Data.success) {
      throw new Error(`Cloudflare R2 upload returned success=false: ${JSON.stringify(r2Data.errors)}`);
    }

    // 3. Construct public URL
    const cleanBase = publicUrlBase.endsWith('/') ? publicUrlBase.slice(0, -1) : publicUrlBase;
    const cleanFilename = filename.startsWith('/') ? filename.slice(1) : filename;
    const fileUrl = `${cleanBase}/${cleanFilename}`;

    // 4. Save to Supabase
    console.log(`Checking sorting mode...`);
    const { data: settingsData } = await supabase
      .from('gallery_items')
      .select('hue')
      .eq('title', '__site_settings__')
      .maybeSingle();

    const isManualMode = settingsData && settingsData.hue === 2.0;
    let nextOrder = null;

    if (isManualMode) {
      console.log("Manual mode is active. Shifting existing items...");
      const { data: items, error: fetchError } = await supabase
        .from('gallery_items')
        .select('id, custom_order')
        .neq('title', '__site_settings__')
        .eq('is_parked', false);
        
      if (!fetchError && items) {
        // Shift custom_orders by 1
        const updates = items.map(item => {
          const currentOrder = item.custom_order ?? 1;
          return supabase
            .from('gallery_items')
            .update({ custom_order: currentOrder + 1 })
            .eq('id', item.id);
        });
        await Promise.all(updates);
      }
      nextOrder = 1;
    }

    console.log(`Saving ${title} metadata to Supabase (order: ${nextOrder}, parked: ${!!is_parked})...`);
    const { data: dbData, error: dbError } = await supabase
      .from('gallery_items')
      .insert({
        src: fileUrl,
        title: title || 'Untitled',
        aspect_ratio: parseFloat(aspect_ratio),
        hue: parseFloat(hue),
        saturation: parseFloat(saturation),
        lightness: parseFloat(lightness),
        custom_order: nextOrder,
        is_parked: !!is_parked
      })
      .select();

    if (dbError) {
      throw new Error(`Supabase Database insert failed: ${dbError.message}`);
    }

    return res.status(200).json({ success: true, item: dbData[0] });

  } catch (err) {
    console.error("Handler error:", err);
    // Return generic error to client, avoiding internal details leakage
    return res.status(500).json({ error: 'Internal server error processing upload' });
  }
}

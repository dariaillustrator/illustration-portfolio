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

  const { image, filename, title, aspect_ratio, hue, saturation, lightness } = req.body;

  if (!image || !filename || aspect_ratio === undefined || hue === undefined || saturation === undefined || lightness === undefined) {
    return res.status(400).json({ error: 'Missing required parameters' });
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
    
    console.log(`Uploading ${filename} to Cloudflare R2...`);
    const r2Res = await fetch(r2Url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'image/jpeg'
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
        .neq('title', '__site_settings__');
        
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

    console.log(`Saving ${title} metadata to Supabase (order: ${nextOrder})...`);
    const { data: dbData, error: dbError } = await supabase
      .from('gallery_items')
      .insert({
        src: fileUrl,
        title: title || 'Untitled',
        aspect_ratio: parseFloat(aspect_ratio),
        hue: parseFloat(hue),
        saturation: parseFloat(saturation),
        lightness: parseFloat(lightness),
        custom_order: nextOrder
      })
      .select();

    if (dbError) {
      throw new Error(`Supabase Database insert failed: ${dbError.message}`);
    }

    return res.status(200).json({ success: true, item: dbData[0] });

  } catch (err) {
    console.error("Handler error:", err);
    return res.status(500).json({ error: err.message });
  }
}

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  // CORS setup
  res.setHeader('Access-Control-Allow-Origin', '*');
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

  const { action, payload } = req.body;
  if (!action) {
    return res.status(400).json({ error: 'Missing action parameter' });
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ error: 'Server misconfigured: missing environment variables.' });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    switch (action) {
      case 'save_order': {
        const { sortingModeVal, activeItems, parkedItems } = payload;
        
        // 1. Update settings row
        const { error: settingsError } = await supabase
          .from('gallery_items')
          .upsert({
            id: '00000000-0000-0000-0000-000000000000',
            src: 'settings',
            title: '__site_settings__',
            aspect_ratio: 0,
            hue: sortingModeVal,
            saturation: 0,
            lightness: 0
          });

        if (settingsError) throw settingsError;

        // 2. Update active items
        const activePromises = activeItems.map((item, idx) => 
          supabase
            .from('gallery_items')
            .update({
              is_parked: false,
              custom_order: sortingModeVal === 2 ? idx + 1 : null
            })
            .eq('id', item.id)
        );

        // 3. Update parked items
        const parkedPromises = parkedItems.map(item => 
          supabase
            .from('gallery_items')
            .update({
              is_parked: true,
              custom_order: null
            })
            .eq('id', item.id)
        );

        const results = await Promise.all([...activePromises, ...parkedPromises]);
        const dbError = results.find(r => r.error);
        if (dbError) throw dbError.error;

        return res.status(200).json({ success: true });
      }

      case 'move_to_trash': {
        const { itemId, trashItems } = payload;

        // 1. Fetch item to move
        const { data: itemData, error: fetchError } = await supabase
          .from('gallery_items')
          .select('*')
          .eq('id', itemId)
          .single();

        if (fetchError) throw fetchError;

        // 2. Delete from gallery_items table
        const { error: delError } = await supabase
          .from('gallery_items')
          .delete()
          .eq('id', itemId);

        if (delError) throw delError;

        // 3. Add to __site_trash__ JSON list
        const trashedItem = { ...itemData, deleted_at: new Date().toISOString() };
        const newTrashList = [...trashItems, trashedItem];

        // 4. Update the __site_trash__ row in DB
        const { data: existingTrash } = await supabase
          .from('gallery_items')
          .select('id')
          .eq('title', '__site_trash__');

        if (existingTrash && existingTrash.length > 0) {
          const { error: updateError } = await supabase
            .from('gallery_items')
            .update({ src: JSON.stringify(newTrashList) })
            .eq('title', '__site_trash__');
          if (updateError) throw updateError;
        } else {
          const { error: insertError } = await supabase
            .from('gallery_items')
            .insert([{
              title: '__site_trash__',
              src: JSON.stringify(newTrashList),
              is_parked: true
            }]);
          if (insertError) throw insertError;
        }

        return res.status(200).json({ success: true, trashList: newTrashList });
      }

      case 'restore_from_trash': {
        const { item } = payload;

        // 1. Insert back to gallery_items
        const { error: insertError } = await supabase
          .from('gallery_items')
          .insert([item]);

        if (insertError) throw insertError;

        // 2. Fetch the current trash list
        const { data: trashRow } = await supabase
          .from('gallery_items')
          .select('src')
          .eq('title', '__site_trash__')
          .maybeSingle();

        let newTrashList = [];
        if (trashRow && trashRow.src) {
          const currentList = JSON.parse(trashRow.src);
          newTrashList = currentList.filter(t => t.id !== item.id);
        }

        // 3. Update the __site_trash__ row
        const { error: updateError } = await supabase
          .from('gallery_items')
          .update({ src: JSON.stringify(newTrashList) })
          .eq('title', '__site_trash__');

        if (updateError) throw updateError;

        return res.status(200).json({ success: true, trashList: newTrashList });
      }

      case 'update_trash_list': {
        const { trashList } = payload;
        // Update the __site_trash__ row with a new list (used after 30-day cleanup)
        const { error: updateError } = await supabase
          .from('gallery_items')
          .update({ src: JSON.stringify(trashList) })
          .eq('title', '__site_trash__');

        if (updateError) throw updateError;
        return res.status(200).json({ success: true });
      }

      case 'submit_request': {
        const { content } = payload;
        const { error } = await supabase
          .from('feature_requests')
          .insert({ content });

        if (error) throw error;
        return res.status(200).json({ success: true });
      }

      case 'complete_request': {
        const { requestId } = payload;
        const { error } = await supabase
          .from('feature_requests')
          .update({ completed: true, completed_at: new Date().toISOString() })
          .eq('id', requestId);

        if (error) throw error;
        return res.status(200).json({ success: true });
      }

      case 'delete_request': {
        const { requestId } = payload;
        const { error } = await supabase
          .from('feature_requests')
          .delete()
          .eq('id', requestId);

        if (error) throw error;
        return res.status(200).json({ success: true });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (err) {
    console.error("Database operation failed:", err);
    return res.status(500).json({ error: `Database operation failed: ${err.message}` });
  }
}

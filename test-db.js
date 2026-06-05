import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const { data, error } = await supabase.from('gallery_items').select('*').limit(1);
  console.log("Data:", data);
  if (data && data.length > 0) {
    const { error: updateError } = await supabase.from('gallery_items').update({ deleted_at: new Date().toISOString() }).eq('id', data[0].id);
    console.log("Update with deleted_at error:", updateError);
  }
}
test();

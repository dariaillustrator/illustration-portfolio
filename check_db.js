import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Parse .env manually
const envPath = './.env';
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    env[match[1]] = value;
  }
});

const supabaseUrl = env.VITE_SUPABASE_URL || 'https://ahulikwglwlwuuxijqwi.supabase.co';
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDb() {
  const { data, error } = await supabase
    .from('gallery_items')
    .select('*')
    .order('hue', { ascending: true })
    .order('saturation', { ascending: true })
    .order('lightness', { ascending: true });

  if (error) {
    console.error("Error fetching gallery items:", error);
    return;
  }

  console.log("Total items:", data.length);
  data.forEach((item, index) => {
    console.log(`[${index + 1}] Title: ${item.title}, Hue: ${item.hue.toFixed(4)}, Sat: ${item.saturation.toFixed(4)}, Light: ${item.lightness.toFixed(4)}`);
  });
}

checkDb();

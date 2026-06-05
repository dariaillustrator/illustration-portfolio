import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ahulikwglwlwuuxijqwi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFodWxpa3dnbHdsd3V1eGlqcXdpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODUxNDYzMCwiZXhwIjoyMDk0MDkwNjMwfQ.7i0Atl2a59cHEr-IjWDexfRldilHkjcs8CHhiOaaooY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Upserting site settings row...");
  const { data, error } = await supabase
    .from('gallery_items')
    .upsert({
      id: '00000000-0000-0000-0000-000000000000',
      src: 'settings',
      title: '__site_settings__',
      aspect_ratio: 0,
      hue: 0.0, // default: normal (not inverted)
      saturation: 0,
      lightness: 0
    });

  if (error) {
    console.error("Error upserting settings:", error);
  } else {
    console.log("Successfully upserted settings row!");
  }
}

run();

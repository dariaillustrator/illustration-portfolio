import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ahulikwglwlwuuxijqwi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFodWxpa3dnbHdsd3V1eGlqcXdpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODUxNDYzMCwiZXhwIjoyMDk0MDkwNjMwfQ.7i0Atl2a59cHEr-IjWDexfRldilHkjcs8CHhiOaaooY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase
    .from('gallery_items')
    .select('*')
    .limit(1);

  if (error) {
    console.error("Error fetching from gallery_items:", error);
  } else {
    console.log("Single row from gallery_items:", data);
  }
}

run();

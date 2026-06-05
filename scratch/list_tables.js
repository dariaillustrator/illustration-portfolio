import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ahulikwglwlwuuxijqwi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFodWxpa3dnbHdsd3V1eGlqcXdpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODUxNDYzMCwiZXhwIjoyMDk0MDkwNjMwfQ.7i0Atl2a59cHEr-IjWDexfRldilHkjcs8CHhiOaaooY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  // Try to query Postgres catalog via PostgREST (this might be restricted or allowed depending on RLS/schema exposure)
  const { data, error } = await supabase
    .from('profiles')
    .select('count', { count: 'exact', head: true });

  console.log("Profiles count response:", { data, error });

  // Let's try to query an arbitrary table or see if we can do something else.
}

run();

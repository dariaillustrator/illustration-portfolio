import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ahulikwglwlwuuxijqwi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFodWxpa3dnbHdsd3V1eGlqcXdpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODUxNDYzMCwiZXhwIjoyMDk0MDkwNjMwfQ.7i0Atl2a59cHEr-IjWDexfRldilHkjcs8CHhiOaaooY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log("--- Supabase Connection Test ---");
  
  // Try to fetch table names using RPC or a direct query to information_schema if possible via REST
  // Since we can't easily query information_schema via standard supabase-js client without a specific RPC
  // we will try to fetch from a known table or use the health check.
  
  try {
    // List tables using SQL (requires service role + enabled SQL access or a helper function)
    // Actually, we can just try to fetch some common tables like 'products' or 'orders' 
    // which I saw in the codebase.
    
    const { data: tables, error: tableError } = await supabase
      .from('products')
      .select('count', { count: 'exact', head: true });

    if (tableError) {
      console.log("Connection verified but 'products' table might be protected or missing:", tableError.message);
    } else {
      console.log("Successfully connected to Supabase! 'products' table is accessible.");
    }

    // Try to get all table names via a simple SQL query if we had one... 
    // For now, confirming connection is enough.
    
  } catch (err) {
    console.error("Connection failed:", err.message);
  }
}

testConnection();

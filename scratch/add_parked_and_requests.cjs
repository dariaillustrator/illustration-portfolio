const { Client } = require('pg');

const connectionString = 'postgresql://postgres.ahulikwglwlwuuxijqwi:DaDa57263_12@aws-0-eu-west-1.pooler.supabase.com:6543/postgres';

async function run() {
  const client = new Client({
    connectionString: connectionString,
    ssl: {
      rejectUnauthorized: false,
      servername: 'aws-0-eu-west-1.pooler.supabase.com'
    }
  });

  try {
    await client.connect();
    console.log('Connected to database!');

    // 1. Add is_parked to gallery_items
    console.log('Adding is_parked column to gallery_items...');
    await client.query(`
      ALTER TABLE public.gallery_items 
      ADD COLUMN IF NOT EXISTS is_parked BOOLEAN DEFAULT false;
    `);

    // 2. Create feature_requests table
    console.log('Creating feature_requests table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.feature_requests (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        content TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `);

    // 3. Enable RLS on feature_requests
    console.log('Enabling RLS on feature_requests...');
    await client.query(`
      ALTER TABLE public.feature_requests ENABLE ROW LEVEL SECURITY;
    `);

    // 4. Create policies for feature_requests
    console.log('Creating policies for feature_requests...');
    await client.query(`
      DROP POLICY IF EXISTS "Allow public insert feature_requests" ON public.feature_requests;
      CREATE POLICY "Allow public insert feature_requests" ON public.feature_requests 
        FOR INSERT WITH CHECK (true);

      DROP POLICY IF EXISTS "Allow public read feature_requests" ON public.feature_requests;
      CREATE POLICY "Allow public read feature_requests" ON public.feature_requests 
        FOR SELECT USING (true);
    `);

    console.log('Migrations executed successfully!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await client.end();
  }
}

run();

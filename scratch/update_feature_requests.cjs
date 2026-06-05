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

    // 1. Add completed and completed_at columns to feature_requests
    console.log('Adding completion columns to feature_requests...');
    await client.query(`
      ALTER TABLE public.feature_requests 
      ADD COLUMN IF NOT EXISTS completed BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
    `);

    // 2. Enable public update/delete policies on feature_requests
    console.log('Creating policies for update/delete on feature_requests...');
    await client.query(`
      DROP POLICY IF EXISTS "Allow public update feature_requests" ON public.feature_requests;
      CREATE POLICY "Allow public update feature_requests" ON public.feature_requests 
        FOR UPDATE USING (true) WITH CHECK (true);

      DROP POLICY IF EXISTS "Allow public delete feature_requests" ON public.feature_requests;
      CREATE POLICY "Allow public delete feature_requests" ON public.feature_requests 
        FOR DELETE USING (true);
    `);

    console.log('Migration completed successfully!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await client.end();
  }
}

run();

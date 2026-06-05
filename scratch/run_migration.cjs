const { Client } = require('pg');

// Use pooler with session mode (port 5432 or 6543)
// We need to set ssl.servername to the pooler host to avoid SSL SNI errors
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
    console.log('Connected to pooler!');

    // Create UPDATE policy for public
    const sql = `
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies 
          WHERE tablename = 'gallery_items' AND policyname = 'Allow public update access'
        ) THEN
          CREATE POLICY "Allow public update access" ON public.gallery_items 
          FOR UPDATE USING (true) WITH CHECK (true);
          RAISE NOTICE 'Policy Allow public update access created.';
        ELSE
          RAISE NOTICE 'Policy already exists.';
        END IF;
      END $$;
    `;

    const res = await client.query(sql);
    console.log('Result:', res);
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await client.end();
  }
}

run();

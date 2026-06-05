const { Client } = require('pg');
const connectionString = 'postgresql://postgres:DaDa57263_12@db.ahulikwglwlwuuxijqwi.supabase.co:5432/postgres';

async function run() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log('Connected to DB');
    
    // Check tables
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public';
    `);
    console.log('Tables in public schema:', res.rows.map(r => r.table_name));

    // Check columns of gallery_items
    const cols = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'gallery_items';
    `);
    console.log('Columns in gallery_items:', cols.rows.map(c => `${c.column_name} (${c.data_type})`));
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}
run();

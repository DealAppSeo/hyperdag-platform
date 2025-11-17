const { Pool } = require('pg');

// Create a connection to the PostgreSQL database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Function to create the API keys table
async function createApiKeysTable() {
  try {
    console.log('Starting API keys table migration...');
    
    // Check if the table already exists
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'api_keys'
      );
    `);
    
    if (tableExists.rows[0].exists) {
      console.log('Table api_keys already exists, skipping creation');
      return;
    }
    
    // Create the API keys table
    await pool.query(`
      CREATE TABLE api_keys (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        key_hash VARCHAR(255) NOT NULL,
        key_prefix VARCHAR(10) NOT NULL,
        scopes TEXT[] NOT NULL,
        active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        last_used TIMESTAMP WITH TIME ZONE
      );
    `);
    
    // Create an index for better query performance
    await pool.query(`
      CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
    `);
    
    console.log('API keys table created successfully');
  } catch (error) {
    console.error('Error creating API keys table:', error);
    throw error;
  } finally {
    // Close the connection pool
    await pool.end();
  }
}

// Run the migration
createApiKeysTable()
  .then(() => {
    console.log('Migration completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
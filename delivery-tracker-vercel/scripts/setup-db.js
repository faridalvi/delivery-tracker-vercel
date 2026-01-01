const { sql } = require('@vercel/postgres');

async function setupDatabase() {
  try {
    // Create deliveries table
    await sql`
      CREATE TABLE IF NOT EXISTS deliveries (
        id SERIAL PRIMARY KEY,
        tracking_code VARCHAR(32) UNIQUE NOT NULL,
        recipient_phone VARCHAR(20) NOT NULL,
        recipient_name VARCHAR(100) NOT NULL,
        package_description VARCHAR(255),
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create locations table
    await sql`
      CREATE TABLE IF NOT EXISTS locations (
        id SERIAL PRIMARY KEY,
        delivery_id INTEGER NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,
        latitude DECIMAL(10, 8) NOT NULL,
        longitude DECIMAL(11, 8) NOT NULL,
        accuracy FLOAT,
        consent_given BOOLEAN DEFAULT TRUE,
        consent_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ip_address VARCHAR(45),
        user_agent TEXT,
        google_maps_link VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_tracking_code ON deliveries(tracking_code)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_status ON deliveries(status)`;

    console.log('Database setup complete!');
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  }
}

setupDatabase();

import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

// Parse connection string - supports raw URL, DATABASE_URL, or psql command string in DATABASE
export function getConnectionString() {
  const raw = process.env.DATABASE_URL || process.env.DATABASE || "";
  const match = raw.match(/postgres(?:ql)?:\/\/[^\s\'\"]+/);
  return match ? match[0] : raw;
}

const connectionString = getConnectionString();
let dbAvailable = false;

export function isDbAvailable() {
  return dbAvailable;
}

export function setDbAvailable(value) {
  dbAvailable = value;
}

export const pool = new pg.Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on("error", (err) => {
  console.error("[PostgreSQL Pool Error]:", err.message);
});

// Helper for running queries
export async function query(text, params) {
  if (!dbAvailable) {
    throw new Error("Database is not available. Backend is running with in-memory data.");
  }

  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV === "development") {
      console.log(`[SQL Query] executed in ${duration}ms, rows: ${res.rowCount}`);
    }
    return res;
  } catch (error) {
    console.error(`[SQL Error]: ${error.message} (Query: ${text})`);
    throw error;
  }
}

// Initialize database schema. Records are managed by the application/database, not demo seeds.
export async function initDb() {
  console.log("[Database] Checking and initializing database schema...");

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1. Users Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL DEFAULT '••••••••',
        role VARCHAR(50) NOT NULL,
        national_id VARCHAR(100),
        phone VARCHAR(100),
        title VARCHAR(255),
        department VARCHAR(255),
        badge_id VARCHAR(100),
        nationality VARCHAR(100),
        status VARCHAR(50) DEFAULT 'active',
        avatar VARCHAR(10),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Audit Logs Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        officer VARCHAR(255),
        action VARCHAR(255),
        target VARCHAR(255),
        ip VARCHAR(100),
        date VARCHAR(100),
        status VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Applications Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS applications (
        documents JSONB,
        timeline JSONB,
        progress INTEGER DEFAULT 0,
        certificate_id VARCHAR(100),
        rejection_reason TEXT,
        id VARCHAR(100) PRIMARY KEY,
        reference_no VARCHAR(100),
        husband JSONB,
        wife JSONB,
        marriage_type VARCHAR(100),
        proposed_date VARCHAR(100),
        venue VARCHAR(255),
        county VARCHAR(100),
        status VARCHAR(50),
        priority VARCHAR(50),
        submission_date VARCHAR(100),
        assigned_officer VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await client.query(`
      ALTER TABLE applications
        ADD COLUMN IF NOT EXISTS payment_status VARCHAR(30) DEFAULT 'unpaid',
        ADD COLUMN IF NOT EXISTS payment_checkout_id VARCHAR(100),
        ADD COLUMN IF NOT EXISTS payment_receipt VARCHAR(100),
        ADD COLUMN IF NOT EXISTS payment_amount INTEGER,
        ADD COLUMN IF NOT EXISTS payment_demo BOOLEAN DEFAULT FALSE;
    `);

    // 4. Certificates Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS certificates (
        id VARCHAR(100) PRIMARY KEY,
        certificate_no VARCHAR(100) UNIQUE,
        application_id VARCHAR(100),
        husband_name VARCHAR(255),
        wife_name VARCHAR(255),
        husband_id VARCHAR(100),
        wife_id VARCHAR(100),
        date_of_marriage VARCHAR(100),
        place_of_marriage VARCHAR(255),
        registrar_name VARCHAR(255),
        qr_code_hash VARCHAR(255),
        blockchain_tx VARCHAR(255),
        status VARCHAR(50),
        issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await client.query(`
      ALTER TABLE certificates
        ADD COLUMN IF NOT EXISTS husband_dob VARCHAR(100),
        ADD COLUMN IF NOT EXISTS husband_birth_place VARCHAR(255),
        ADD COLUMN IF NOT EXISTS husband_nationality VARCHAR(100),
        ADD COLUMN IF NOT EXISTS wife_dob VARCHAR(100),
        ADD COLUMN IF NOT EXISTS wife_birth_place VARCHAR(255),
        ADD COLUMN IF NOT EXISTS wife_nationality VARCHAR(100);
    `);

    // 5. Notifications Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(100),
        type VARCHAR(50) DEFAULT 'info',
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query("COMMIT");

    const checkUsers = await client.query("SELECT COUNT(*) FROM users");
    const userCount = parseInt(checkUsers.rows[0].count, 10);
    console.log(`[Database] Connected! ${userCount} users found in PostgreSQL database.`);

    setDbAvailable(true);
    return true;
  } catch (err) {
    await client.query("ROLLBACK");
    setDbAvailable(false);
    console.error("[Database] Error initializing database:", err);
    throw err;
  } finally {
    client.release();
  }
}

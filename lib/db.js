import mysql from 'mysql2/promise'

// Singleton pool — reuse across hot-reloads in dev
let pool

export function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host:     process.env.DATABASE_HOST,
      port:     parseInt(process.env.DATABASE_PORT || '3306'),
      user:     process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      waitForConnections: true,
      connectionLimit:    10,
      ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: true } : undefined,
    })
  }
  return pool
}

export async function query(sql, params = []) {
  const pool = getPool()
  const [rows] = await pool.execute(sql, params)
  return rows
}

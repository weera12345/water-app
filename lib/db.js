const mysql = require('mysql2/promise')

let pool

function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host:     process.env.DATABASE_HOST,
      port:     parseInt(process.env.DATABASE_PORT || '3306'),
      user:     process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: true } : undefined,
    })
  }
  return pool
}

async function query(sql, params = []) {
  const p = getPool()
  const [rows] = await p.execute(sql, params)
  return rows
}

module.exports = { getPool, query }

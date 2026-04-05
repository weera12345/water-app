const { query } = require('../../../lib/db')
const bcrypt = require('bcryptjs')

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const rows = await query(
        'SELECT id, username, full_name, role, active, created_at FROM users ORDER BY id'
      )
      return res.json(rows)
    }

    if (req.method === 'POST') {
      const { username, password, full_name, role } = req.body
      if (!username || !password || !full_name || !role)
        return res.status(400).json({ error: 'กรุณากรอกข้อมูลให้ครบ' })
      const hash = await bcrypt.hash(password, 10)
      const result = await query(
        'INSERT INTO users (username, password, full_name, role) VALUES (?, ?, ?, ?)',
        [username, hash, full_name, role]
      )
      return res.status(201).json({ id: result.insertId, message: 'เพิ่มผู้ใช้สำเร็จ' })
    }

    res.setHeader('Allow', ['GET', 'POST'])
    res.status(405).end('Method Not Allowed')
  } catch (err) {
    console.error(err)
    if (err.code === 'ER_DUP_ENTRY')
      return res.status(409).json({ error: 'ชื่อผู้ใช้นี้มีอยู่แล้ว' })
    res.status(500).json({ error: 'เกิดข้อผิดพลาด: ' + err.message })
  }
}

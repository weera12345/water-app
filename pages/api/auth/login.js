const { query } = require('../../../lib/db')
const bcrypt = require('bcryptjs')

export default async function handler(req, res) {
  if (req.method !== 'POST')
    return res.status(405).end('Method Not Allowed')

  const { username, password } = req.body
  if (!username || !password)
    return res.status(400).json({ error: 'กรุณากรอก username และ password' })

  try {
    const rows = await query(
      'SELECT id, username, password, full_name, role, active FROM users WHERE username = ?',
      [username]
    )
    if (!rows.length)
      return res.status(401).json({ error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' })

    const user = rows[0]
    if (!user.active)
      return res.status(403).json({ error: 'บัญชีนี้ถูกระงับการใช้งาน' })

    const match = await bcrypt.compare(password, user.password)
    if (!match)
      return res.status(401).json({ error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' })

    return res.json({
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      role: user.role,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'เกิดข้อผิดพลาด: ' + err.message })
  }
}

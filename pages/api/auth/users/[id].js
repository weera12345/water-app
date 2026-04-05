const { query } = require('../../../../lib/db')
const bcrypt = require('bcryptjs')

export default async function handler(req, res) {
  const { id } = req.query
  try {
    if (req.method === 'PUT') {
      const { full_name, role, active, password } = req.body
      if (password) {
        const hash = await bcrypt.hash(password, 10)
        await query(
          'UPDATE users SET full_name=?, role=?, active=?, password=? WHERE id=?',
          [full_name, role, active, hash, id]
        )
      } else {
        await query(
          'UPDATE users SET full_name=?, role=?, active=? WHERE id=?',
          [full_name, role, active, id]
        )
      }
      return res.json({ message: 'อัปเดตผู้ใช้สำเร็จ' })
    }

    if (req.method === 'DELETE') {
      await query('DELETE FROM users WHERE id=?', [id])
      return res.json({ message: 'ลบผู้ใช้สำเร็จ' })
    }

    res.setHeader('Allow', ['PUT', 'DELETE'])
    res.status(405).end('Method Not Allowed')
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'เกิดข้อผิดพลาด: ' + err.message })
  }
}

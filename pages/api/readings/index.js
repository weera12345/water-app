const { query } = require('../../../lib/db')

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const { year, month } = req.query
      let sql = `
        SELECT r.id, r.member_id, r.year, r.month,
               r.prev_meter, r.cur_meter, r.units, r.price_per_unit, r.amount,
               m.first_name, m.last_name, m.house_no, m.village, m.moo, m.tambon
        FROM meter_readings r
        JOIN members m ON r.member_id = m.id
      `
      const params = []
      if (year && month) { sql += ' WHERE r.year=? AND r.month=?'; params.push(year, month) }
      else if (year)     { sql += ' WHERE r.year=?'; params.push(year) }
      sql += ' ORDER BY r.year DESC, r.month DESC, m.house_no'
      const rows = await query(sql, params)
      return res.json(rows)
    }
    if (req.method === 'POST') {
      const { member_id, year, month, prev_meter, cur_meter, price_per_unit } = req.body
      if (!member_id || cur_meter == null || prev_meter == null)
        return res.status(400).json({ error: 'กรุณากรอกข้อมูลที่จำเป็น' })
      if (Number(cur_meter) < Number(prev_meter))
        return res.status(400).json({ error: 'เลขมิเตอร์ใหม่ต้องมากกว่าหรือเท่ากับเลขเดิม' })
      const result = await query(
        `INSERT INTO meter_readings (member_id, year, month, prev_meter, cur_meter, price_per_unit)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [member_id, year, month, prev_meter, cur_meter, price_per_unit||8]
      )
      return res.status(201).json({ id: result.insertId, message: 'บันทึกมิเตอร์สำเร็จ' })
    }
    res.setHeader('Allow', ['GET','POST'])
    res.status(405).end('Method Not Allowed')
  } catch (err) {
    console.error(err)
    if (err.code === 'ER_DUP_ENTRY')
      return res.status(409).json({ error: 'มีข้อมูลมิเตอร์ของสมาชิกนี้ในเดือนนี้แล้ว' })
    res.status(500).json({ error: 'เกิดข้อผิดพลาด: ' + err.message })
  }
}

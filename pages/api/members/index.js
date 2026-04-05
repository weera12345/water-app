const { query } =require( '../../lib/db')

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const rows = await query(
        `SELECT id, first_name, last_name, house_no, address, moo, village, tambon, amphoe, province
         FROM members ORDER BY id`
      )
      return res.json(rows)
    }

    if (req.method === 'POST') {
      const { first_name, last_name, house_no, address, moo, village, tambon, amphoe, province } = req.body
      if (!first_name || !last_name || !house_no)
        return res.status(400).json({ error: 'กรุณากรอกข้อมูลที่จำเป็น' })

      const result = await query(
        `INSERT INTO members (first_name, last_name, house_no, address, moo, village, tambon, amphoe, province)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [first_name, last_name, house_no, address || '', moo || '', village || '', tambon || '', amphoe || 'อำเภอศีขรภูมิ', province || 'จังหวัดสุรินทร์']
      )
      return res.status(201).json({ id: result.insertId, message: 'เพิ่มสมาชิกสำเร็จ' })
    }

    res.setHeader('Allow', ['GET', 'POST'])
    res.status(405).end('Method Not Allowed')
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'เกิดข้อผิดพลาด: ' + err.message })
  }
}

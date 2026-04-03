const { query } = require('../../../lib/db')

export default async function handler(req, res) {
  const { id } = req.query
  try {
    if (req.method === 'PUT') {
      const { first_name, last_name, house_no, address, moo, village, tambon, amphoe, province } = req.body
      if (!first_name || !last_name || !house_no)
        return res.status(400).json({ error: 'กรุณากรอกข้อมูลที่จำเป็น' })
      await query(
        `UPDATE members SET first_name=?, last_name=?, house_no=?, address=?, moo=?, village=?, tambon=?, amphoe=?, province=?
         WHERE id=?`,
        [first_name, last_name, house_no, address||'', moo||'', village||'', tambon||'', amphoe||'อำเภอศีขรภูมิ', province||'จังหวัดสุรินทร์', id]
      )
      return res.json({ message: 'แก้ไขข้อมูลสำเร็จ' })
    }
    if (req.method === 'DELETE') {
      await query('DELETE FROM members WHERE id = ?', [id])
      return res.json({ message: 'ลบสมาชิกสำเร็จ' })
    }
    res.setHeader('Allow', ['PUT','DELETE'])
    res.status(405).end('Method Not Allowed')
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'เกิดข้อผิดพลาด: ' + err.message })
  }
}

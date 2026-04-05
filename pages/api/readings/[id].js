const { query } =require( '../../lib/db')

export default async function handler(req, res) {
  const { id } = req.query

  try {
    if (req.method === 'DELETE') {
      await query('DELETE FROM meter_readings WHERE id = ?', [id])
      return res.json({ message: 'ลบรายการสำเร็จ' })
    }

    res.setHeader('Allow', ['DELETE'])
    res.status(405).end('Method Not Allowed')
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'เกิดข้อผิดพลาด: ' + err.message })
  }
}

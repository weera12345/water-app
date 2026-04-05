const { query } =require( '../../lib/db')

export default async function handler(req, res) {
  const { year, month } = req.query
  if (!year || !month)
    return res.status(400).json({ error: 'กรุณาระบุ year และ month' })

  try {
    const rows = await query(
      `SELECT
         r.id, r.member_id, r.year, r.month,
         r.prev_meter, r.cur_meter, r.units, r.price_per_unit, r.amount,
         m.first_name, m.last_name, m.house_no, m.moo, m.village, m.tambon
       FROM meter_readings r
       JOIN members m ON r.member_id = m.id
       WHERE r.year = ? AND r.month = ?
       ORDER BY m.house_no`,
      [year, month]
    )

    const totals = await query(
      `SELECT
         COUNT(*) AS total_members,
         COALESCE(SUM(units), 0)  AS total_units,
         COALESCE(SUM(amount), 0) AS total_amount
       FROM meter_readings
       WHERE year = ? AND month = ?`,
      [year, month]
    )

    return res.json({ rows, totals: totals[0] })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'เกิดข้อผิดพลาด: ' + err.message })
  }
}

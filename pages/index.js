import { useState, useMemo, useEffect, useCallback } from 'react'
import Head from 'next/head'

const VILLAGES = ['บ้านบุละลาย']
const TAMBONS  = ['ตำบลแตล']
const MONTHS   = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.']
const RATE     = 8

// ── API helpers ──────────────────────────────────────────────────
async function apiFetch(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'เกิดข้อผิดพลาด')
  return data
}

export default function Home() {
  const [tab, setTab]               = useState('members')
  const [members, setMembers]       = useState([])
  const [readings, setReadings]     = useState([])
  const [summary, setSummary]       = useState({ rows: [], totals: {} })
  const [loading, setLoading]       = useState(true)
  const [saving, setSaving]         = useState(false)
  const [toast, setToast]           = useState(null)

  const [showMemberForm, setShowMemberForm] = useState(false)
  const [showUsageForm,  setShowUsageForm]  = useState(false)
  const [editMember,     setEditMember]     = useState(null)
  const [confirmDelete,  setConfirmDelete]  = useState(null)
  const [searchQ,        setSearchQ]        = useState('')
  const [filterMonth,    setFilterMonth]    = useState(new Date().getMonth() + 1)
  const [filterYear,     setFilterYear]     = useState(2568)

  const emptyM = { first_name:'', last_name:'', house_no:'', address:'', moo:'', village:VILLAGES[0], tambon:TAMBONS[0], amphoe:'อำเภอศีขรภูมิ', province:'จังหวัดสุรินทร์' }
  const emptyU = { member_id:'', year:2568, month:new Date().getMonth()+1, prev_meter:'', cur_meter:'', price_per_unit:RATE }
  const [mForm, setMForm] = useState(emptyM)
  const [uForm, setUForm] = useState(emptyU)

  function showToast(msg, type='success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 2800)
  }

  // ── Load members ──
  const loadMembers = useCallback(async () => {
    const data = await apiFetch('/api/members')
    setMembers(data)
  }, [])

  // ── Load readings ──
  const loadReadings = useCallback(async () => {
    const data = await apiFetch('/api/readings')
    setReadings(data)
  }, [])

  // ── Load summary ──
  const loadSummary = useCallback(async (year, month) => {
    const data = await apiFetch(`/api/summary?year=${year}&month=${month}`)
    setSummary(data)
  }, [])

  useEffect(() => {
    (async () => {
      setLoading(true)
      try {
        await Promise.all([loadMembers(), loadReadings()])
      } catch(e) { showToast(e.message, 'error') }
      setLoading(false)
    })()
  }, [])

  useEffect(() => {
    if (tab === 'summary') loadSummary(filterYear, filterMonth).catch(e => showToast(e.message,'error'))
  }, [tab, filterYear, filterMonth])

  // ── last meter for member ──
  function lastMeter(memberId) {
    const items = readings.filter(r => r.member_id === memberId)
      .sort((a,b) => a.year !== b.year ? b.year-a.year : b.month-a.month)
    return items.length ? items[0].cur_meter : ''
  }

  // ── Save member ──
  async function saveMember() {
    if (!mForm.first_name || !mForm.last_name || !mForm.house_no) return
    setSaving(true)
    try {
      if (editMember) {
        await apiFetch(`/api/members/${editMember.id}`, { method:'PUT', body: JSON.stringify(mForm) })
        showToast('แก้ไขข้อมูลสำเร็จ')
      } else {
        await apiFetch('/api/members', { method:'POST', body: JSON.stringify(mForm) })
        showToast('เพิ่มสมาชิกสำเร็จ')
      }
      await loadMembers()
      setMForm(emptyM); setEditMember(null); setShowMemberForm(false)
    } catch(e) { showToast(e.message,'error') }
    setSaving(false)
  }

  // ── Save reading ──
  async function saveUsage() {
    if (!uForm.member_id || uForm.cur_meter==='' || uForm.prev_meter==='') return
    setSaving(true)
    try {
      await apiFetch('/api/readings', { method:'POST', body: JSON.stringify(uForm) })
      showToast('บันทึกมิเตอร์สำเร็จ')
      await loadReadings()
      setUForm(emptyU); setShowUsageForm(false)
    } catch(e) { showToast(e.message,'error') }
    setSaving(false)
  }

  // ── Delete member ──
  async function doDeleteMember() {
    setSaving(true)
    try {
      await apiFetch(`/api/members/${confirmDelete}`, { method:'DELETE' })
      showToast('ลบสมาชิกสำเร็จ')
      await loadMembers()
      setConfirmDelete(null)
    } catch(e) { showToast(e.message,'error') }
    setSaving(false)
  }

  // ── Delete reading ──
  async function deleteReading(id) {
    setSaving(true)
    try {
      await apiFetch(`/api/readings/${id}`, { method:'DELETE' })
      showToast('ลบรายการสำเร็จ')
      await loadReadings()
    } catch(e) { showToast(e.message,'error') }
    setSaving(false)
  }

  function openEdit(m) { setEditMember(m); setMForm({ first_name:m.first_name, last_name:m.last_name, house_no:m.house_no, address:m.address, moo:m.moo, village:m.village, tambon:m.tambon, amphoe:m.amphoe||'อำเภอศีขรภูมิ', province:m.province||'จังหวัดสุรินทร์' }); setShowMemberForm(true) }

  const filteredMembers = useMemo(() =>
    members.filter(m => `${m.first_name} ${m.last_name} ${m.house_no} ${m.village}`.toLowerCase().includes(searchQ.toLowerCase())),
    [members, searchQ])

  const units = Number(uForm.cur_meter) - Number(uForm.prev_meter)

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#0f2027,#203a43,#2c5364)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Sarabun',sans-serif", color:'#43e3ff', fontSize:20 }}>
      💧 กำลังโหลดข้อมูล...
    </div>
  )

  return (
    <>
      <Head>
        <title>ระบบน้ำประปาหมู่บ้านบุละลาย อ.ศีขรภูมิ จ.สุรินทร์</title>
        <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;600;700&display=swap" rel="stylesheet" />
      </Head>

      <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#0f2027 0%,#203a43 50%,#2c5364 100%)', fontFamily:"'Sarabun',sans-serif", color:'#e8f4fd' }}>

        {/* Toast */}
        {toast && (
          <div style={{ position:'fixed', top:20, right:20, zIndex:9999, padding:'12px 22px', borderRadius:10, fontWeight:600, fontSize:14, background: toast.type==='error' ? '#c0392b' : '#1a7a4a', color:'#fff', boxShadow:'0 4px 20px rgba(0,0,0,0.4)', transition:'all 0.3s' }}>
            {toast.type==='error' ? '❌' : '✅'} {toast.msg}
          </div>
        )}

        {/* Confirm Delete */}
        {confirmDelete && (
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:999, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <div style={{ background:'#142533', border:'1px solid rgba(255,80,80,0.3)', borderRadius:16, padding:32, maxWidth:360, textAlign:'center' }}>
              <div style={{ fontSize:38, marginBottom:10 }}>⚠️</div>
              <div style={{ fontSize:16, fontWeight:700, color:'#ff8888', marginBottom:8 }}>ยืนยันการลบสมาชิก?</div>
              <div style={{ color:'#8ec8e8', fontSize:13, marginBottom:20 }}>ข้อมูลมิเตอร์ทั้งหมดของสมาชิกนี้จะถูกลบออกด้วย</div>
              <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
                <button onClick={doDeleteMember} disabled={saving} style={{ padding:'9px 24px', borderRadius:8, border:'none', cursor:'pointer', background:'#c0392b', color:'#fff', fontFamily:'inherit', fontWeight:700 }}>ลบ</button>
                <button onClick={() => setConfirmDelete(null)} style={btnSecStyle}>ยกเลิก</button>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div style={{ background:'rgba(255,255,255,0.05)', backdropFilter:'blur(20px)', borderBottom:'1px solid rgba(100,200,255,0.15)', padding:'0 24px' }}>
          <div style={{ maxWidth:1150, margin:'0 auto', display:'flex', alignItems:'center', gap:16, padding:'16px 0', flexWrap:'wrap' }}>
            <div style={{ width:46, height:46, borderRadius:'50%', background:'linear-gradient(135deg,#43e3ff,#0080cc)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>💧</div>
            <div>
              <div style={{ fontSize:19, fontWeight:700, color:'#43e3ff' }}>ระบบน้ำประปาหมู่บ้านบุละลาย</div>
              <div style={{ fontSize:12, color:'#8ec8e8' }}>บ้านบุละลาย ตำบลแตล อำเภอศีขรภูมิ จังหวัดสุรินทร์</div>
            </div>
            {saving && <span style={{ fontSize:12, color:'#ffd700' }}>⏳ กำลังบันทึก...</span>}
            <div style={{ marginLeft:'auto', display:'flex', gap:8, flexWrap:'wrap' }}>
              {[['members','👥 สมาชิก'],['usage','🚿 บันทึกมิเตอร์'],['summary','📊 สรุปรายเดือน']].map(([key,label]) => (
                <button key={key} onClick={() => setTab(key)} style={{ padding:'8px 16px', borderRadius:8, border:'none', cursor:'pointer', fontFamily:'inherit', fontSize:13, fontWeight:600, background: tab===key ? 'linear-gradient(135deg,#43e3ff,#0080cc)' : 'rgba(255,255,255,0.08)', color: tab===key ? '#001a26' : '#8ec8e8' }}>{label}</button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ maxWidth:1150, margin:'0 auto', padding:'26px 24px' }}>

          {/* ── MEMBERS ── */}
          {tab==='members' && (
            <div>
              <div style={{ display:'flex', gap:12, marginBottom:20, flexWrap:'wrap', alignItems:'center' }}>
                <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="🔍 ค้นหาชื่อ / บ้านเลขที่ / หมู่บ้าน..." style={{ ...inputStyle, maxWidth:340 }} />
                <button onClick={() => { setEditMember(null); setMForm(emptyM); setShowMemberForm(true) }} style={btnPrimaryStyle}>+ เพิ่มสมาชิก</button>
                <span style={{ marginLeft:'auto', fontSize:13, color:'#7aa8be' }}>ทั้งหมด {members.length} ราย</span>
              </div>

              {showMemberForm && (
                <div style={formCardStyle}>
                  <div style={{ fontSize:15, fontWeight:700, color:'#43e3ff', marginBottom:16 }}>{editMember ? '✏️ แก้ไขข้อมูลสมาชิก' : '➕ เพิ่มสมาชิกใหม่'}</div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(175px,1fr))', gap:12 }}>
                    {[['first_name','ชื่อ *'],['last_name','นามสกุล *'],['house_no','บ้านเลขที่ *'],['address','ที่อยู่'],['moo','หมู่ที่']].map(([k,lbl]) => (
                      <div key={k}>
                        <div style={labelStyle}>{lbl}</div>
                        <input value={mForm[k]} onChange={e => setMForm(p=>({...p,[k]:e.target.value}))} style={inputStyle} placeholder={lbl.replace(' *','')} />
                      </div>
                    ))}
                    <div>
                      <div style={labelStyle}>หมู่บ้าน</div>
                      <select value={mForm.village} onChange={e => setMForm(p=>({...p,village:e.target.value}))} style={inputStyle}>
                        {VILLAGES.map(v=><option key={v}>{v}</option>)}
                      </select>
                    </div>
                    <div>
                      <div style={labelStyle}>ตำบล</div>
                      <select value={mForm.tambon} onChange={e => setMForm(p=>({...p,tambon:e.target.value}))} style={inputStyle}>
                        {TAMBONS.map(v=><option key={v}>{v}</option>)}
                      </select>
                    </div>
                    <div>
                      <div style={labelStyle}>อำเภอ</div>
                      <input value={mForm.amphoe} onChange={e=>setMForm(p=>({...p,amphoe:e.target.value}))} style={inputStyle} placeholder="อำเภอศีขรภูมิ" />
                    </div>
                    <div>
                      <div style={labelStyle}>จังหวัด</div>
                      <input value={mForm.province} onChange={e=>setMForm(p=>({...p,province:e.target.value}))} style={inputStyle} placeholder="จังหวัดสุรินทร์" />
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:10, marginTop:16 }}>
                    <button onClick={saveMember} disabled={saving} style={btnPrimaryStyle}>💾 บันทึก</button>
                    <button onClick={() => { setShowMemberForm(false); setEditMember(null) }} style={btnSecStyle}>ยกเลิก</button>
                  </div>
                </div>
              )}

              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead>
                    <tr style={{ background:'rgba(67,227,255,0.08)' }}>
                      {['#','ชื่อ-สกุล','บ้านเลขที่','ที่อยู่','หมู่','หมู่บ้าน','ตำบล','อำเภอ','จังหวัด','มิเตอร์ล่าสุด','จัดการ'].map(h=>(
                        <th key={h} style={thStyle}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMembers.map((m,i)=>(
                      <tr key={m.id} style={{ borderBottom:'1px solid rgba(255,255,255,0.05)' }}
                        onMouseEnter={e=>e.currentTarget.style.background='rgba(67,227,255,0.04)'}
                        onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                        <td style={tdStyle}>{i+1}</td>
                        <td style={{ ...tdStyle, fontWeight:600, color:'#cef4ff' }}>{m.first_name} {m.last_name}</td>
                        <td style={tdStyle}>{m.house_no}</td>
                        <td style={tdStyle}>{m.address}</td>
                        <td style={tdStyle}>หมู่ {m.moo}</td>
                        <td style={tdStyle}>{m.village}</td>
                        <td style={tdStyle}>{m.tambon}</td>
                        <td style={tdStyle}>{m.amphoe||'อำเภอศีขรภูมิ'}</td>
                        <td style={tdStyle}>{m.province||'จังหวัดสุรินทร์'}</td>
                        <td style={{ ...tdStyle, textAlign:'right', color:'#43e3ff', fontWeight:600 }}>
                          {lastMeter(m.id)!=='' ? Number(lastMeter(m.id)).toLocaleString() : <span style={{ color:'#5a8fa8' }}>-</span>}
                        </td>
                        <td style={tdStyle}>
                          <button onClick={()=>openEdit(m)} style={{ ...btnMiniStyle, marginRight:6 }}>✏️</button>
                          <button onClick={()=>setConfirmDelete(m.id)} style={{ ...btnMiniStyle, background:'rgba(255,80,80,0.12)', color:'#ff8888' }}>🗑️</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredMembers.length===0 && <div style={{ textAlign:'center', padding:40, color:'#5a8fa8' }}>ไม่พบข้อมูลสมาชิก</div>}
              </div>
            </div>
          )}

          {/* ── USAGE ── */}
          {tab==='usage' && (
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20, flexWrap:'wrap', gap:10 }}>
                <span style={{ color:'#7aa8be', fontSize:13 }}>บันทึกทั้งหมด {readings.length} รายการ</span>
                <button onClick={()=>setShowUsageForm(true)} style={btnPrimaryStyle}>+ บันทึกมิเตอร์</button>
              </div>

              {showUsageForm && (
                <div style={formCardStyle}>
                  <div style={{ fontSize:15, fontWeight:700, color:'#43e3ff', marginBottom:16 }}>📝 บันทึกค่ามิเตอร์น้ำ</div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(170px,1fr))', gap:12 }}>
                    <div style={{ gridColumn:'span 2' }}>
                      <div style={labelStyle}>สมาชิก *</div>
                      <select value={uForm.member_id} onChange={e => {
                        const id = Number(e.target.value)
                        const lm = lastMeter(id)
                        setUForm(p=>({...p, member_id:e.target.value, prev_meter: lm!=='' ? lm : ''}))
                      }} style={inputStyle}>
                        <option value=''>-- เลือกสมาชิก --</option>
                        {members.map(m=><option key={m.id} value={m.id}>{m.first_name} {m.last_name} (บ้าน {m.house_no})</option>)}
                      </select>
                    </div>
                    <div>
                      <div style={labelStyle}>ปี (พ.ศ.)</div>
                      <input type='number' value={uForm.year} onChange={e=>setUForm(p=>({...p,year:e.target.value}))} style={inputStyle} />
                    </div>
                    <div>
                      <div style={labelStyle}>เดือน</div>
                      <select value={uForm.month} onChange={e=>setUForm(p=>({...p,month:e.target.value}))} style={inputStyle}>
                        {MONTHS.map((m,i)=><option key={i} value={i+1}>{m}</option>)}
                      </select>
                    </div>
                    <div>
                      <div style={labelStyle}>มิเตอร์เดิม</div>
                      <input type='number' value={uForm.prev_meter} onChange={e=>setUForm(p=>({...p,prev_meter:e.target.value}))} style={inputStyle} />
                    </div>
                    <div>
                      <div style={labelStyle}>มิเตอร์ใหม่</div>
                      <input type='number' value={uForm.cur_meter} onChange={e=>setUForm(p=>({...p,cur_meter:e.target.value}))} style={inputStyle} />
                    </div>
                    <div>
                      <div style={labelStyle}>ราคา/หน่วย (บาท)</div>
                      <input type='number' value={uForm.price_per_unit} onChange={e=>setUForm(p=>({...p,price_per_unit:e.target.value}))} style={inputStyle} />
                    </div>
                  </div>
                  {uForm.cur_meter!=='' && uForm.prev_meter!=='' && units>=0 && (
                    <div style={{ marginTop:12, padding:'12px 16px', background:'rgba(67,227,255,0.08)', borderRadius:10, color:'#43e3ff', fontWeight:600, border:'1px solid rgba(67,227,255,0.15)' }}>
                      💧 ใช้น้ำ <span style={{ fontSize:20 }}>{units}</span> หน่วย = <span style={{ color:'#ffd700', fontSize:20 }}>{(units*Number(uForm.price_per_unit)).toLocaleString()}</span> บาท
                    </div>
                  )}
                  <div style={{ display:'flex', gap:10, marginTop:16 }}>
                    <button onClick={saveUsage} disabled={saving} style={btnPrimaryStyle}>💾 บันทึก</button>
                    <button onClick={()=>setShowUsageForm(false)} style={btnSecStyle}>ยกเลิก</button>
                  </div>
                </div>
              )}

              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead>
                    <tr style={{ background:'rgba(67,227,255,0.08)' }}>
                      {['#','สมาชิก','บ้านเลขที่','ปี','เดือน','มิเตอร์เดิม','มิเตอร์ใหม่','หน่วย','ราคา/หน่วย','ยอดเงิน','ลบ'].map(h=>(
                        <th key={h} style={thStyle}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {readings.map((r,i)=>{
                      const u = Number(r.units)
                      return (
                        <tr key={r.id} style={{ borderBottom:'1px solid rgba(255,255,255,0.05)' }}
                          onMouseEnter={e=>e.currentTarget.style.background='rgba(67,227,255,0.04)'}
                          onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                          <td style={tdStyle}>{i+1}</td>
                          <td style={{ ...tdStyle, color:'#cef4ff', fontWeight:600 }}>{r.first_name} {r.last_name}</td>
                          <td style={tdStyle}>{r.house_no}</td>
                          <td style={tdStyle}>{r.year}</td>
                          <td style={tdStyle}>{MONTHS[r.month-1]}</td>
                          <td style={{ ...tdStyle, textAlign:'right' }}>{Number(r.prev_meter).toLocaleString()}</td>
                          <td style={{ ...tdStyle, textAlign:'right' }}>{Number(r.cur_meter).toLocaleString()}</td>
                          <td style={{ ...tdStyle, textAlign:'right', color:'#43e3ff', fontWeight:700 }}>{u}</td>
                          <td style={{ ...tdStyle, textAlign:'right' }}>{r.price_per_unit}</td>
                          <td style={{ ...tdStyle, textAlign:'right', color:'#7fffb4', fontWeight:700 }}>{Number(r.amount).toLocaleString()}</td>
                          <td style={tdStyle}>
                            <button onClick={()=>deleteReading(r.id)} style={{ ...btnMiniStyle, background:'rgba(255,80,80,0.12)', color:'#ff8888' }}>🗑️</button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                {readings.length===0 && <div style={{ textAlign:'center', padding:40, color:'#5a8fa8' }}>ยังไม่มีข้อมูลมิเตอร์</div>}
              </div>
            </div>
          )}

          {/* ── SUMMARY ── */}
          {tab==='summary' && (
            <div>
              <div style={{ display:'flex', gap:14, marginBottom:24, alignItems:'flex-end', flexWrap:'wrap' }}>
                <div>
                  <div style={labelStyle}>ปี (พ.ศ.)</div>
                  <input type='number' value={filterYear} onChange={e=>setFilterYear(Number(e.target.value))} style={{ ...inputStyle, width:100 }} />
                </div>
                <div>
                  <div style={labelStyle}>เดือน</div>
                  <select value={filterMonth} onChange={e=>setFilterMonth(Number(e.target.value))} style={{ ...inputStyle, width:120 }}>
                    {MONTHS.map((m,i)=><option key={i} value={i+1}>{m}</option>)}
                  </select>
                </div>
                <div style={{ fontSize:18, fontWeight:700, color:'#43e3ff', paddingBottom:2 }}>📋 {MONTHS[filterMonth-1]} {filterYear}</div>
              </div>

              {/* KPI */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(190px,1fr))', gap:14, marginBottom:28 }}>
                {[
                  { label:'สมาชิกที่มีข้อมูล', value:summary.totals.total_members||0, unit:'ราย', color:'#43e3ff', icon:'👥' },
                  { label:'ปริมาณน้ำรวม', value:Number(summary.totals.total_units||0).toLocaleString(), unit:'หน่วย', color:'#7fffb4', icon:'💧' },
                  { label:'ยอดเรียกเก็บรวม', value:Number(summary.totals.total_amount||0).toLocaleString(), unit:'บาท', color:'#ffd700', icon:'💰' },
                  { label:'เฉลี่ยต่อราย', value: summary.totals.total_members ? Math.round(summary.totals.total_amount/summary.totals.total_members).toLocaleString() : '0', unit:'บาท', color:'#ff9f7f', icon:'📊' },
                ].map(card=>(
                  <div key={card.label} style={{ background:'rgba(255,255,255,0.04)', borderRadius:14, padding:'18px 20px 14px', border:`1px solid ${card.color}22` }}>
                    <div style={{ fontSize:26, marginBottom:6 }}>{card.icon}</div>
                    <div style={{ fontSize:24, fontWeight:700, color:card.color }}>{card.value} <span style={{ fontSize:12, fontWeight:400, opacity:0.8 }}>{card.unit}</span></div>
                    <div style={{ fontSize:12, color:'#7aa8be', marginTop:3 }}>{card.label}</div>
                  </div>
                ))}
              </div>

              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead>
                    <tr style={{ background:'rgba(67,227,255,0.08)' }}>
                      {['#','ชื่อ-สกุล','บ้านเลขที่','หมู่บ้าน','มิเตอร์เดิม','มิเตอร์ใหม่','หน่วย','ราคา/หน่วย','ยอดเงิน'].map(h=>(
                        <th key={h} style={thStyle}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {summary.rows.map((r,i)=>(
                      <tr key={r.id} style={{ borderBottom:'1px solid rgba(255,255,255,0.05)' }}
                        onMouseEnter={e=>e.currentTarget.style.background='rgba(67,227,255,0.04)'}
                        onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                        <td style={tdStyle}>{i+1}</td>
                        <td style={{ ...tdStyle, color:'#cef4ff', fontWeight:600 }}>{r.first_name} {r.last_name}</td>
                        <td style={tdStyle}>{r.house_no}</td>
                        <td style={tdStyle}>{r.village}</td>
                        <td style={{ ...tdStyle, textAlign:'right' }}>{Number(r.prev_meter).toLocaleString()}</td>
                        <td style={{ ...tdStyle, textAlign:'right' }}>{Number(r.cur_meter).toLocaleString()}</td>
                        <td style={{ ...tdStyle, textAlign:'right', color:'#43e3ff', fontWeight:700 }}>{Number(r.units)}</td>
                        <td style={{ ...tdStyle, textAlign:'right' }}>{r.price_per_unit}</td>
                        <td style={{ ...tdStyle, textAlign:'right', color:'#7fffb4', fontWeight:700 }}>{Number(r.amount).toLocaleString()}</td>
                      </tr>
                    ))}
                    {summary.rows.length>0 && (
                      <tr style={{ background:'rgba(67,227,255,0.07)', fontWeight:700 }}>
                        <td colSpan={6} style={{ ...tdStyle, textAlign:'right', color:'#43e3ff' }}>รวมทั้งหมด</td>
                        <td style={{ ...tdStyle, textAlign:'right', color:'#43e3ff' }}>{Number(summary.totals.total_units||0)}</td>
                        <td style={tdStyle}></td>
                        <td style={{ ...tdStyle, textAlign:'right', color:'#ffd700', fontSize:16 }}>{Number(summary.totals.total_amount||0).toLocaleString()}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
                {summary.rows.length===0 && <div style={{ textAlign:'center', padding:40, color:'#5a8fa8' }}>ไม่มีข้อมูลในเดือน {MONTHS[filterMonth-1]} {filterYear}</div>}
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  )
}

const inputStyle = { background:'rgba(255,255,255,0.07)', border:'1px solid rgba(67,227,255,0.18)', borderRadius:8, padding:'9px 12px', color:'#e8f4fd', fontFamily:"'Sarabun',sans-serif", fontSize:14, outline:'none', width:'100%', boxSizing:'border-box' }
const btnPrimaryStyle = { padding:'9px 20px', borderRadius:8, border:'none', cursor:'pointer', fontFamily:"'Sarabun',sans-serif", fontSize:14, fontWeight:700, background:'linear-gradient(135deg,#43e3ff,#0080cc)', color:'#001a26', whiteSpace:'nowrap', flexShrink:0 }
const btnSecStyle = { padding:'9px 20px', borderRadius:8, border:'1px solid rgba(255,255,255,0.15)', cursor:'pointer', fontFamily:"'Sarabun',sans-serif", fontSize:14, background:'transparent', color:'#8ec8e8' }
const btnMiniStyle = { padding:'4px 10px', borderRadius:6, border:'none', cursor:'pointer', background:'rgba(67,227,255,0.1)', color:'#43e3ff', fontSize:13 }
const thStyle = { padding:'11px 13px', textAlign:'left', fontSize:13, color:'#43e3ff', fontWeight:700, whiteSpace:'nowrap' }
const tdStyle = { padding:'10px 13px', fontSize:14, color:'#c8e8f8' }
const labelStyle = { fontSize:12, color:'#7aa8be', marginBottom:5 }
const formCardStyle = { background:'rgba(255,255,255,0.05)', borderRadius:16, padding:22, marginBottom:20, border:'1px solid rgba(67,227,255,0.18)' }

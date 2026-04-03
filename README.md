# 💧 ระบบน้ำประปาหมู่บ้าน — คู่มือ Deploy

## โครงสร้างไฟล์
```
water-app/
├── lib/
│   └── db.js                    ← MySQL connection pool
├── pages/
│   ├── index.js                 ← หน้าหลัก (Frontend)
│   └── api/
│       ├── members/
│       │   ├── index.js         ← GET /api/members, POST /api/members
│       │   └── [id].js          ← PUT /api/members/:id, DELETE /api/members/:id
│       ├── readings/
│       │   ├── index.js         ← GET /api/readings, POST /api/readings
│       │   └── [id].js          ← DELETE /api/readings/:id
│       └── summary.js           ← GET /api/summary?year=&month=
├── schema.sql                   ← สร้างตาราง MySQL
├── .env.local.example           ← ตัวอย่าง environment variables
├── next.config.js
└── package.json
```

---

## ขั้นตอนที่ 1 — เตรียม MySQL Database (ฟรี)

### ตัวเลือก A: Railway (แนะนำ)
1. ไปที่ https://railway.app → สมัคร/Login
2. คลิก **"New Project"** → เลือก **"MySQL"**
3. หลัง deploy เสร็จ คลิกที่ MySQL service → แท็บ **"Variables"**
4. จดค่าเหล่านี้ไว้:
   - `MYSQLHOST` → DATABASE_HOST
   - `MYSQLPORT` → DATABASE_PORT
   - `MYSQLUSER` → DATABASE_USER
   - `MYSQLPASSWORD` → DATABASE_PASSWORD
   - `MYSQLDATABASE` → DATABASE_NAME
5. คลิกแท็บ **"Data"** → วาง SQL ทั้งหมดจาก `schema.sql` → รัน

### ตัวเลือก B: PlanetScale (MySQL-compatible)
1. ไปที่ https://planetscale.com → สมัคร/Login
2. สร้าง database ใหม่ → เลือก region ใกล้สุด
3. คลิก **"Connect"** → เลือก **"Node.js"** → คัดลอก connection string
4. รัน `schema.sql` ผ่าน PlanetScale console

---

## ขั้นตอนที่ 2 — Upload ขึ้น GitHub

```bash
# ติดตั้ง dependencies
npm install

# สร้าง repo ใหม่บน github.com แล้วรันคำสั่งเหล่านี้:
git init
git add .
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/water-app.git
git push -u origin main
```

---

## ขั้นตอนที่ 3 — Deploy บน Vercel

1. ไปที่ https://vercel.com → สมัคร/Login ด้วย GitHub
2. คลิก **"Add New Project"** → เลือก repo `water-app`
3. คลิก **"Environment Variables"** และเพิ่มค่าต่อไปนี้:

| Key | Value |
|-----|-------|
| `DATABASE_HOST` | (จาก Railway/PlanetScale) |
| `DATABASE_PORT` | `3306` |
| `DATABASE_USER` | (จาก Railway/PlanetScale) |
| `DATABASE_PASSWORD` | (จาก Railway/PlanetScale) |
| `DATABASE_NAME` | `water_billing` |
| `DATABASE_SSL` | `true` (ถ้าใช้ PlanetScale) |

4. คลิก **"Deploy"** รอประมาณ 1-2 นาที
5. ✅ เสร็จ! ได้ URL เช่น `https://water-app-xxx.vercel.app`

---

## รันใน Local (สำหรับทดสอบ)

```bash
# copy ไฟล์ env
cp .env.local.example .env.local
# แก้ไขค่าใน .env.local ให้ถูกต้อง

npm install
npm run dev
# เปิด http://localhost:3000
```

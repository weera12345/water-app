-- ระบบจัดเก็บน้ำประปาหมู่บ้านบุละลาย
-- รัน script นี้ใน MySQL ก่อนเริ่มใช้งาน

CREATE DATABASE IF NOT EXISTS water_billing CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE water_billing;

-- ตารางสมาชิก
CREATE TABLE IF NOT EXISTS members (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  first_name  VARCHAR(100) NOT NULL,
  last_name   VARCHAR(100) NOT NULL,
  house_no    VARCHAR(20)  NOT NULL,
  address     VARCHAR(200),
  moo         VARCHAR(10),
  village     VARCHAR(100),
  tambon      VARCHAR(100),
  amphoe      VARCHAR(100) DEFAULT 'อำเภอศีขรภูมิ',
  province    VARCHAR(100) DEFAULT 'จังหวัดสุรินทร์',
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ตารางบันทึกมิเตอร์
CREATE TABLE IF NOT EXISTS meter_readings (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  member_id       INT NOT NULL,
  year            INT NOT NULL,
  month           INT NOT NULL,
  prev_meter      DECIMAL(10,2) NOT NULL DEFAULT 0,
  cur_meter       DECIMAL(10,2) NOT NULL DEFAULT 0,
  units           DECIMAL(10,2) GENERATED ALWAYS AS (cur_meter - prev_meter) STORED,
  price_per_unit  DECIMAL(10,2) NOT NULL DEFAULT 8,
  amount          DECIMAL(10,2) GENERATED ALWAYS AS ((cur_meter - prev_meter) * price_per_unit) STORED,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
  UNIQUE KEY uq_member_month (member_id, year, month)
) ENGINE=InnoDB;

-- ข้อมูลตัวอย่าง
INSERT IGNORE INTO members (id, first_name, last_name, house_no, address, moo, village, tambon, amphoe, province) VALUES
(1, 'สมชาย',  'ใจดี',    '12/1', 'หมู่ 1', '1', 'บ้านบุละลาย', 'ตำบลแตล', 'อำเภอศีขรภูมิ', 'จังหวัดสุรินทร์'),
(2, 'สมหญิง', 'รักถิ่น', '45',   'หมู่ 1', '1', 'บ้านบุละลาย', 'ตำบลแตล', 'อำเภอศีขรภูมิ', 'จังหวัดสุรินทร์'),
(3, 'วิชัย',  'พลังดี',  '7/2',  'หมู่ 1', '1', 'บ้านบุละลาย', 'ตำบลแตล', 'อำเภอศีขรภูมิ', 'จังหวัดสุรินทร์'),
(4, 'นารี',   'สมบูรณ์', '23',   'หมู่ 1', '1', 'บ้านบุละลาย', 'ตำบลแตล', 'อำเภอศีขรภูมิ', 'จังหวัดสุรินทร์');

INSERT IGNORE INTO meter_readings (member_id, year, month, prev_meter, cur_meter, price_per_unit) VALUES
(1, 2568, 1, 100, 118, 8),
(1, 2568, 2, 118, 135, 8),
(1, 2568, 3, 135, 156, 8),
(2, 2568, 1,  50,  65, 8),
(2, 2568, 2,  65,  82, 8),
(2, 2568, 3,  82, 100, 8),
(3, 2568, 1, 200, 220, 8),
(3, 2568, 2, 220, 245, 8),
(4, 2568, 1,   0,  12, 8);

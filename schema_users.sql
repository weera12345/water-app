-- เพิ่มตาราง users สำหรับระบบ Login
USE water_billing;

CREATE TABLE IF NOT EXISTS users (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  username    VARCHAR(50) NOT NULL UNIQUE,
  password    VARCHAR(255) NOT NULL,
  full_name   VARCHAR(100) NOT NULL,
  role        ENUM('admin','user','collector') NOT NULL DEFAULT 'user',
  active      TINYINT(1) NOT NULL DEFAULT 1,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ข้อมูลเริ่มต้น (password: admin1234)
-- bcrypt hash ของ "admin1234"
INSERT IGNORE INTO users (username, password, full_name, role) VALUES
('admin',     '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'ผู้ดูแลระบบ',        'admin'),
('collector', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'เจ้าหน้าที่เก็บเงิน', 'collector'),
('user1',     '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'ผู้ใช้ทั่วไป',       'user');

-- หมายเหตุ: password เริ่มต้นทุก account คือ "password"
-- ให้ Admin เปลี่ยน password หลัง login ครั้งแรก

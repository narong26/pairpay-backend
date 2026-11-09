const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// ที่เก็บข้อมูลชั่วคราว (ข้อมูลจะหายเมื่อเซิร์ฟเวอร์รีสตาร์ท)
const users = [];

// ใช้ตรวจว่าเซิร์ฟเวอร์ทำงานอยู่
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'PairPay backend is running' });
});

// สมัครสมาชิก (รับได้ทั้ง /register และ /api/register)
app.post(['/register', '/api/register'], (req, res) => {
  const { nickname, idCard, role, phone, username } = req.body;

  if (!nickname || !idCard || !phone || !username) {
    return res.status(400).json({ success: false, message: 'กรุณากรอกข้อมูลให้ครบ' });
  }
  if (users.find(u => u.username === username)) {
    return res.status(409).json({ success: false, message: 'Username นี้ถูกใช้แล้ว' });
  }

  users.push({ nickname, idCard, role, phone, username });
  res.status(201).json({ success: true, message: 'สมัครสมาชิกสำเร็จ' });
});

// เข้าสู่ระบบ (รับได้ทั้ง /login และ /api/login)
app.post(['/login', '/api/login'], (req, res) => {
  const { username, phone } = req.body;
  const user = users.find(u => u.username === username && u.phone === phone);
  if (!user) {
    return res.status(401).json({ success: false, message: 'Username หรือรหัสผ่านไม่ถูกต้อง' });
  }
  res.json({ success: true, user: { nickname: user.nickname, username: user.username, role: user.role } });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

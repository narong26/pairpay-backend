const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(express.json());

// เชื่อมต่อ MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB error:', err.message));

// Schema สำหรับ User
const userSchema = new mongoose.Schema({
  nickname: { type: String, required: true },
  idCard:   { type: String, required: true },
  role:     { type: String },
  phone:    { type: String, required: true },
  username: { type: String, required: true, unique: true }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

// Schema สำหรับ Transaction (อัปเดตให้รองรับสลิป)
const transactionSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  userNickname: { type: String, required: true },
  userRole: { type: String, required: true },
  category: { type: String, required: true },
  amount: { type: Number, required: true },
  description: { type: String },
  slipUrl: { type: String }, // <-- เพิ่มเก็บลิงก์รูปสลิป (Base64 หรือ URL)
  dateTime: { type: String, required: true }
}, { timestamps: true });

const Transaction = mongoose.model('Transaction', transactionSchema);

// หน้าแรกเช็กสถานะ
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    db: mongoose.connection.readyState === 1 ? 'connected' : 'not connected'
  });
});

// สมัครสมาชิก (รองรับทั้งแบบมีและไม่มี /api/auth)
app.post(['/register', '/api/auth/register', '/api/register'], async (req, res) => {
  try {
    const { nickname, idCard, role, phone, username } = req.body;
    if (!nickname || !idCard || !phone || !username) {
      return res.status(400).json({ success: false, message: 'กรุณากรอกข้อมูลให้ครบ' });
    }
    if (await User.findOne({ username })) {
      return res.status(409).json({ success: false, message: 'Username นี้ถูกใช้แล้ว' });
    }
    await User.create({ nickname, idCard, role, phone, username });
    res.status(201).json({ success: true, message: 'สมัครสมาชิกสำเร็จ' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์' });
  }
});

// เข้าสู่ระบบ (รองรับทั้งแบบมีและไม่มี /api/auth และใช้เบอร์โทรเป็นรหัสผ่าน)
app.post(['/login', '/api/auth/login', '/api/login'], async (req, res) => {
  try {
    const { username, password, phone } = req.body;
    // รองรับทั้งช่อง password และ phone
    const loginPhone = password || phone;
    
    const user = await User.findOne({ username, phone: loginPhone });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Username หรือ รหัสผ่าน (เบอร์โทรศัพท์) ไม่ถูกต้อง' });
    }
    res.json({ success: true, user: { nickname: user.nickname, username: user.username, role: user.role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์' });
  }
});

// ดึงรายการรายจ่ายทั้งหมด
app.get('/api/transactions', async (req, res) => {
  try {
    const txs = await Transaction.find().sort({ dateTime: -1 });
    res.json(txs);
  } catch (err) {
    res.status(500).json({ success: false, message: 'ไม่สามารถดึงข้อมูลได้' });
  }
});

// บันทึกรายการรายจ่ายใหม่
app.post('/api/transactions', async (req, res) => {
  try {
    const newTx = await Transaction.create(req.body);
    res.status(201).json({ success: true, data: newTx });
  } catch (err) {
    res.status(500).json({ success: false, message: 'ไม่สามารถบันทึกข้อมูลได้' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

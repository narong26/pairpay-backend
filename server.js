const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB error:', err.message));

const userSchema = new mongoose.Schema({
  nickname: { type: String, required: true },
  idCard:   { type: String, required: true },
  role:     { type: String },
  phone:    { type: String, required: true },
  username: { type: String, required: true, unique: true }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    db: mongoose.connection.readyState === 1 ? 'connected' : 'not connected'
  });
});

app.post(['/register', '/api/register'], async (req, res) => {
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

app.post(['/login', '/api/login'], async (req, res) => {
  try {
    const { username, phone } = req.body;
    const user = await User.findOne({ username, phone });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Username หรือรหัสผ่านไม่ถูกต้อง' });
    }
    res.json({ success: true, user: { nickname: user.nickname, username: user.username, role: user.role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

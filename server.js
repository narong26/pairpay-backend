const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json({ limit: '15mb' })); // รองรับอัปโหลดสลิปขนาดใหญ่

// 1. เชื่อมต่อ MongoDB
const MONGO_URI = process.env.MONGO_URI || 'ใส่_Mongo_URI_ของคุณตรงนี้';
mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('MongoDB Connected')).catch(err => console.log(err));

// 2. โครงสร้างฐานข้อมูล (Schema) - รายจ่าย
const transactionSchema = new mongoose.Schema({
    userId: String,
    userNickname: String,
    userRole: String,
    category: String,
    amount: Number,
    description: String,
    slipUrl: String,
    dateTime: String
}, { timestamps: true });

const Transaction = mongoose.model('Transaction', transactionSchema);

// โครงสร้างฐานข้อมูล (Schema) - สมาชิก
const userSchema = new mongoose.Schema({
    nickname: String,
    idCard: String,
    role: String,
    phone: String,
    username: { type: String, unique: true }
});

const User = mongoose.model('User', userSchema);

// ================= API ROUTES: Transactions =================

// ดึงรายการทั้งหมด
app.get('/api/transactions', async (req, res) => {
    try {
        const transactions = await Transaction.find().sort({ dateTime: -1 });
        res.json(transactions);
    } catch (err) {
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูล', error: err.message });
    }
});

// เพิ่มรายการใหม่
app.post('/api/transactions', async (req, res) => {
    try {
        const newTx = new Transaction(req.body);
        const saved = await newTx.save();
        res.status(201).json(saved);
    } catch (err) {
        res.status(500).json({ message: 'บันทึกไม่สำเร็จ', error: err.message });
    }
});

// แก้ไขรายการ (PUT)
app.put('/api/transactions/:id', async (req, res) => {
    try {
        const { category, amount, description, slipUrl, dateTime } = req.body;
        const updated = await Transaction.findByIdAndUpdate(
            req.params.id,
            { category, amount, description, slipUrl, dateTime },
            { new: true }
        );
        if (!updated) return res.status(404).json({ message: 'ไม่พบรายการบนเซิร์ฟเวอร์' });
        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: 'แก้ไขไม่สำเร็จ', error: err.message });
    }
});

// ลบรายการ (DELETE)
app.delete('/api/transactions/:id', async (req, res) => {
    try {
        const deleted = await Transaction.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: 'ไม่พบรายการบนเซิร์ฟเวอร์' });
        res.json({ message: 'ลบสำเร็จ' });
    } catch (err) {
        res.status(500).json({ message: 'ลบไม่สำเร็จ', error: err.message });
    }
});

// ================= API ROUTES: Auth (ระบบสมาชิก) =================

// สมัครสมาชิก
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, phone, nickname, idCard, role } = req.body;
        const existing = await User.findOne({ username });
        if (existing) {
            return res.status(400).json({ message: 'Username นี้ถูกใช้งานแล้ว' });
        }
        
        const newUser = new User({ username, phone, nickname, idCard, role });
        await newUser.save();
        res.status(201).json({ message: 'สมัครสมาชิกสำเร็จ' });
    } catch (err) {
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการสมัครสมาชิก', error: err.message });
    }
});

// เข้าสู่ระบบ
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        // ตรวจสอบ username และใช้เบอร์โทรศัพท์เป็นรหัสผ่าน (password)
        const user = await User.findOne({ username, phone: password });
        if (!user) {
            return res.status(400).json({ message: 'Username หรือ รหัสผ่านไม่ถูกต้อง' });
        }
        
        res.json({ message: 'เข้าสู่ระบบสำเร็จ', user });
    } catch (err) {
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ', error: err.message });
    }
});

// 3. รันเซิร์ฟเวอร์
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

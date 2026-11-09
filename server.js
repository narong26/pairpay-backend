const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// เชื่อมต่อไปยัง MongoDB Atlas (อ่านค่าจาก Environment Variable)
const MONGO_URI = process.env.MONGO_URI;
mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ Connected to MongoDB successfully'))
    .catch(err => console.error('❌ MongoDB connection error:', err));

// Schema สำหรับผู้ใช้
const userSchema = new mongoose.Schema({
    nickname: { type: String, required: true },
    idCard: { type: String, required: true },
    role: { type: String, enum: ['สามี', 'ภรรยา'], required: true },
    phone: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});
const User = mongoose.model('User', userSchema);

// Schema สำหรับรายการรายจ่าย
const transactionSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    userNickname: { type: String, required: true },
    userRole: { type: String, required: true },
    category: { type: String, required: true },
    amount: { type: Number, required: true },
    description: { type: String },
    dateTime: { type: Date, required: true }
});
const Transaction = mongoose.model('Transaction', transactionSchema);

// API Register
app.post('/api/register', async (req, res) => {
    try {
        const { nickname, idCard, role, phone, username } = req.body;
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Username นี้ถูกใช้งานแล้ว' });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(phone, salt);
        const newUser = new User({ nickname, idCard, role, phone, username, password: hashedPassword });
        await newUser.save();
        res.status(201).json({ success: true, message: 'สมัครสมาชิกสำเร็จ' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// API Login
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ success: false, message: 'Username หรือ รหัสผ่านไม่ถูกต้อง' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Username หรือ รหัสผ่านไม่ถูกต้อง' });
        }
        res.json({
            success: true,
            user: { nickname: user.nickname, role: user.role, username: user.username, phone: user.phone }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// API Get Transactions
app.get('/api/transactions', async (req, res) => {
    try {
        const transactions = await Transaction.find().sort({ dateTime: -1 });
        res.json({ success: true, data: transactions });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// API Add Transaction
app.post('/api/transactions', async (req, res) => {
    try {
        const { userId, userNickname, userRole, category, amount, description, dateTime } = req.body;
        const newTx = new Transaction({ userId, userNickname, userRole, category, amount, description, dateTime });
        await newTx.save();
        res.status(201).json({ success: true, data: newTx });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 PairPay Backend Server is running on port ${PORT}`);
});
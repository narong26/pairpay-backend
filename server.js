const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json({ limit: '15mb' })); // รองรับอัปโหลดสลิปขนาดใหญ่

// 1. เชื่อมต่อ MongoDB (ใช้ Connection String ของคุณ)
const MONGO_URI = process.env.MONGO_URI || 'ใส่_Mongo_URI_ของคุณตรงนี้';
mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('MongoDB Connected')).catch(err => console.log(err));

// 2. โครงสร้างฐานข้อมูล (Schema)
const transactionSchema = new mongoose.Schema({
    userId: String,
    userNickname: String,
    userRole: String,
    category: String,
    amount: Number,
    description: String,
    slipUrl: String,
    dateTime: String
});

const Transaction = mongoose.model('Transaction', transactionSchema);

// (ถ้ามี Schema หรือ Model ของ User อยู่แล้ว ให้คงไว้ตามเดิม ไม่ต้องลบออก)

// ================= API ROUTES =================

// ดึงรายการทั้งหมด
app.get('/api/transactions', async (req, res) => {
    try {
        const transactions = await Transaction.find().sort({ dateTime: -1 });
        res.json(transactions);
    } catch (err) {
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูล' });
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

// ** แก้ไขรายการ (PUT) **
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

// ** ลบรายการ (DELETE) **
app.delete('/api/transactions/:id', async (req, res) => {
    try {
        const deleted = await Transaction.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: 'ไม่พบรายการบนเซิร์ฟเวอร์' });
        res.json({ message: 'ลบสำเร็จ' });
    } catch (err) {
        res.status(500).json({ message: 'ลบไม่สำเร็จ', error: err.message });
    }
});

// รันเซิร์ฟเวอร์
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

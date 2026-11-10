// รองรับการแก้ไขรายการ (PUT)
app.put('/api/transactions/:id', async (req, res) => {
  try {
    const { category, amount, description, slipUrl, dateTime } = req.body;
    const updated = await Transaction.findByIdAndUpdate(
      req.params.id,
      { category, amount, description, slipUrl, dateTime },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: 'ไม่พบรายการ' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'แก้ไขไม่สำเร็จ', error: err.message });
  }
});

// รองรับการลบรายการ (DELETE)
app.delete('/api/transactions/:id', async (req, res) => {
  try {
    const deleted = await Transaction.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'ไม่พบรายการ' });
    res.json({ message: 'ลบสำเร็จ' });
  } catch (err) {
    res.status(500).json({ message: 'ลบไม่สำเร็จ', error: err.message });
  }
});

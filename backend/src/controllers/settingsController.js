const prisma = require('../utils/prisma');

// Get settings
exports.get = async (req, res) => {
    try {
        let settings = await prisma.settings.findFirst();

        if (!settings) {
            settings = await prisma.settings.create({
                data: {
                    dormName: 'หอพักของฉัน',
                    waterRate: 18,
                    electricRate: 8
                }
            });
        }

        res.json(settings);
    } catch (error) {
        console.error('Get settings error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงการตั้งค่า' });
    }
};

// Update settings
exports.update = async (req, res) => {
    try {
        const { dormName, address, waterRate, electricRate } = req.body;

        let settings = await prisma.settings.findFirst();

        if (!settings) {
            settings = await prisma.settings.create({
                data: {
                    dormName: dormName || 'หอพักของฉัน',
                    address,
                    waterRate: waterRate ? parseFloat(waterRate) : 18,
                    electricRate: electricRate ? parseFloat(electricRate) : 8
                }
            });
        } else {
            settings = await prisma.settings.update({
                where: { id: settings.id },
                data: {
                    ...(dormName && { dormName }),
                    ...(address !== undefined && { address }),
                    ...(waterRate && { waterRate: parseFloat(waterRate) }),
                    ...(electricRate && { electricRate: parseFloat(electricRate) }),
                    ...(req.body.promptPayID !== undefined && { promptPayID: req.body.promptPayID }),
                    ...(req.body.promptPayName !== undefined && { promptPayName: req.body.promptPayName }),
                    ...(req.body.lineNotifyToken !== undefined && { lineNotifyToken: req.body.lineNotifyToken })
                }
            });
        }

        res.json({ message: 'อัปเดตการตั้งค่าสำเร็จ', settings });
    } catch (error) {
        console.error('Update settings error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการอัปเดตการตั้งค่า' });
    }
};

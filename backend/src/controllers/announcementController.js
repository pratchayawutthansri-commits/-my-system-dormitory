const prisma = require('../utils/prisma');

// Get all announcements (Admin view - sees all)
exports.getAllAnnouncements = async (req, res) => {
    try {
        const announcements = await prisma.announcement.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json(announcements);
    } catch (error) {
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูลประกาศ' });
    }
};

// Get active announcements (Tenant view - sees only active)
exports.getActiveAnnouncements = async (req, res) => {
    try {
        const announcements = await prisma.announcement.findMany({
            where: { isActive: true },
            orderBy: [
                { importance: 'desc' }, // URGENT first
                { createdAt: 'desc' }
            ]
        });
        res.json(announcements);
    } catch (error) {
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูลประกาศ' });
    }
};

// Create a new announcement
exports.createAnnouncement = async (req, res) => {
    try {
        const { title, content, importance } = req.body;
        console.log('Creating announcement:', req.body); // Log input
        const announcement = await prisma.announcement.create({
            data: {
                title,
                content,
                importance: importance || 'NORMAL'
            }
        });
        res.status(201).json(announcement);
    } catch (error) {
        console.error('Error creating announcement:', error); // Log full error
        res.status(500).json({ error: error.message || 'เกิดข้อผิดพลาดในการสร้างประกาศ' });
    }
};

// Update an announcement
exports.updateAnnouncement = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, importance, isActive } = req.body;

        const announcement = await prisma.announcement.update({
            where: { id: parseInt(id) },
            data: {
                title,
                content,
                importance,
                isActive
            }
        });
        res.json(announcement);
    } catch (error) {
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการแก้ไขประกาศ' });
    }
};

// Delete an announcement
exports.deleteAnnouncement = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.announcement.delete({
            where: { id: parseInt(id) }
        });
        res.json({ message: 'ลบประกาศสำเร็จ' });
    } catch (error) {
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการลบประกาศ' });
    }
};

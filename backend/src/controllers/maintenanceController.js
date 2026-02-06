const prisma = require('../utils/prisma');

// ดึงรายการแจ้งซ่อมทั้งหมด (Admin เห็นทั้งหมด, Tenant เห็นเฉพาะของตัวเอง)
exports.getMaintenanceRequests = async (req, res) => {
    try {
        const { role, id: userId } = req.user;
        const { status } = req.query;

        let whereClause = {};

        // ถ้าเป็น Tenant ให้เห็นเฉพาะของตัวเอง
        if (role === 'TENANT') {
            whereClause.tenantId = userId;
        }

        // ถ้ามี filter สถานะ
        if (status && ['PENDING', 'IN_PROGRESS', 'COMPLETED'].includes(status)) {
            whereClause.status = status;
        }

        const requests = await prisma.maintenanceRequest.findMany({
            where: whereClause,
            include: {
                room: {
                    select: {
                        roomNumber: true
                    }
                },
                tenant: {
                    select: {
                        firstName: true,
                        lastName: true,
                        phone: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(requests);
    } catch (error) {
        console.error('Get maintenance requests error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' });
    }
};

// ดึงรายละเอียดการแจ้งซ่อม
exports.getMaintenanceById = async (req, res) => {
    try {
        const { id } = req.params;
        const { role, id: userId } = req.user;

        const request = await prisma.maintenanceRequest.findUnique({
            where: { id: parseInt(id) },
            include: {
                room: {
                    select: {
                        roomNumber: true
                    }
                },
                tenant: {
                    select: {
                        firstName: true,
                        lastName: true,
                        phone: true,
                        email: true
                    }
                }
            }
        });

        if (!request) {
            return res.status(404).json({ error: 'ไม่พบรายการแจ้งซ่อม' });
        }

        // Tenant สามารถดูได้เฉพาะของตัวเอง
        if (role === 'TENANT' && request.tenantId !== userId) {
            return res.status(403).json({ error: 'ไม่มีสิทธิ์เข้าถึงข้อมูลนี้' });
        }

        res.json(request);
    } catch (error) {
        console.error('Get maintenance by id error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' });
    }
};

// สร้างการแจ้งซ่อมใหม่ (Tenant)
// สร้างการแจ้งซ่อมใหม่ (Tenant)
exports.createMaintenance = async (req, res) => {
    try {
        const { id: userId } = req.user;
        const { title, description, imageData } = req.body;

        console.log(`[Maintenance] New request from user ${userId}: ${title}`);

        // ตรวจสอบว่ากรอกข้อมูลครบ
        if (!title || !description) {
            return res.status(400).json({ error: 'กรุณากรอกหัวข้อและรายละเอียด' });
        }

        // หา room ของ tenant
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { room: true }
        });

        if (!user) {
            console.error(`[Maintenance] User ${userId} not found in DB`);
            return res.status(404).json({ error: 'ไม่พบข้อมูลผู้ใช้ (User not found)' });
        }

        if (!user.room) {
            console.error(`[Maintenance] User ${userId} has no room`);
            return res.status(400).json({ error: 'คุณยังไม่ได้เช่าห้อง ไม่สามารถแจ้งซ่อมได้' });
        }

        const request = await prisma.maintenanceRequest.create({
            data: {
                roomId: user.room.id,
                tenantId: userId,
                title: title.trim(),
                description: description.trim(),
                imageData: imageData || null
            },
            include: {
                room: {
                    select: {
                        roomNumber: true
                    }
                }
            }
        });

        console.log(`[Maintenance] Request created: ${request.id}`);

        res.status(201).json({
            message: 'แจ้งซ่อมสำเร็จ',
            request
        });
    } catch (error) {
        console.error('[Maintenance] Create Error:', error);
        res.status(500).json({ error: error.message || 'เกิดข้อผิดพลาดในการแจ้งซ่อม' });
    }
};

// อัพเดทสถานะการแจ้งซ่อม (Admin only)
exports.updateMaintenanceStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, adminNote } = req.body;

        // ตรวจสอบสถานะที่ถูกต้อง
        if (!['PENDING', 'IN_PROGRESS', 'COMPLETED'].includes(status)) {
            return res.status(400).json({ error: 'สถานะไม่ถูกต้อง' });
        }

        const existing = await prisma.maintenanceRequest.findUnique({
            where: { id: parseInt(id) }
        });

        if (!existing) {
            return res.status(404).json({ error: 'ไม่พบรายการแจ้งซ่อม' });
        }

        const updateData = {
            status,
            adminNote: adminNote || existing.adminNote
        };

        // ถ้าเปลี่ยนเป็น COMPLETED ให้บันทึกเวลาเสร็จ
        if (status === 'COMPLETED') {
            updateData.completedAt = new Date();
        }

        const request = await prisma.maintenanceRequest.update({
            where: { id: parseInt(id) },
            data: updateData,
            include: {
                room: {
                    select: {
                        roomNumber: true
                    }
                },
                tenant: {
                    select: {
                        firstName: true,
                        lastName: true
                    }
                }
            }
        });

        res.json({
            message: 'อัพเดทสถานะสำเร็จ',
            request
        });
    } catch (error) {
        console.error('Update maintenance status error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการอัพเดทสถานะ' });
    }
};

// ลบการแจ้งซ่อม (Admin only)
exports.deleteMaintenance = async (req, res) => {
    try {
        const { id } = req.params;

        const existing = await prisma.maintenanceRequest.findUnique({
            where: { id: parseInt(id) }
        });

        if (!existing) {
            return res.status(404).json({ error: 'ไม่พบรายการแจ้งซ่อม' });
        }

        await prisma.maintenanceRequest.delete({
            where: { id: parseInt(id) }
        });

        res.json({ message: 'ลบรายการแจ้งซ่อมสำเร็จ' });
    } catch (error) {
        console.error('Delete maintenance error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการลบข้อมูล' });
    }
};

// สรุปสถิติการแจ้งซ่อม (Admin)
exports.getMaintenanceStats = async (req, res) => {
    try {
        const [pending, inProgress, completed, total] = await Promise.all([
            prisma.maintenanceRequest.count({ where: { status: 'PENDING' } }),
            prisma.maintenanceRequest.count({ where: { status: 'IN_PROGRESS' } }),
            prisma.maintenanceRequest.count({ where: { status: 'COMPLETED' } }),
            prisma.maintenanceRequest.count()
        ]);

        res.json({
            pending,
            inProgress,
            completed,
            total
        });
    } catch (error) {
        console.error('Get maintenance stats error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงสถิติ' });
    }
};

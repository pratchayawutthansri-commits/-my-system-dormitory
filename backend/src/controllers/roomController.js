const prisma = require('../utils/prisma');

// Get all rooms
exports.getAll = async (req, res) => {
    try {
        const rooms = await prisma.room.findMany({
            include: {
                tenant: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true,
                        depositAmount: true,
                        contractStartDate: true,
                        contractEndDate: true
                    }
                }
            },
            orderBy: { roomNumber: 'asc' }
        });

        res.json(rooms);
    } catch (error) {
        console.error('Get rooms error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูลห้อง' });
    }
};

// Get single room
exports.getOne = async (req, res) => {
    try {
        const { id } = req.params;
        const room = await prisma.room.findUnique({
            where: { id: parseInt(id) },
            include: {
                tenant: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true
                    }
                },
                meterReadings: {
                    orderBy: { readingDate: 'desc' },
                    take: 12
                },
                invoices: {
                    orderBy: { billingMonth: 'desc' },
                    take: 12
                }
            }
        });

        if (!room) {
            return res.status(404).json({ error: 'ไม่พบห้องที่ระบุ' });
        }

        res.json(room);
    } catch (error) {
        console.error('Get room error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูลห้อง' });
    }
};

// Create room
exports.create = async (req, res) => {
    try {
        const { roomNumber, baseRent, floor } = req.body;

        if (!roomNumber || !baseRent) {
            return res.status(400).json({ error: 'กรุณากรอกหมายเลขห้องและค่าเช่า' });
        }

        const existingRoom = await prisma.room.findUnique({ where: { roomNumber } });
        if (existingRoom) {
            return res.status(400).json({ error: 'หมายเลขห้องนี้มีอยู่แล้ว' });
        }

        const room = await prisma.room.create({
            data: {
                roomNumber,
                baseRent: parseFloat(baseRent),
                floor: floor ? parseInt(floor) : 1
            }
        });

        res.status(201).json({ message: 'เพิ่มห้องสำเร็จ', room });
    } catch (error) {
        console.error('Create room error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการเพิ่มห้อง' });
    }
};

// Update room
exports.update = async (req, res) => {
    try {
        const { id } = req.params;
        const { roomNumber, baseRent, floor, status } = req.body;

        const room = await prisma.room.update({
            where: { id: parseInt(id) },
            data: {
                ...(roomNumber && { roomNumber }),
                ...(baseRent && { baseRent: parseFloat(baseRent) }),
                ...(floor && { floor: parseInt(floor) }),
                ...(status && { status })
            }
        });

        res.json({ message: 'อัปเดตห้องสำเร็จ', room });
    } catch (error) {
        console.error('Update room error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการอัปเดตห้อง' });
    }
};

// Delete room
exports.delete = async (req, res) => {
    try {
        const { id } = req.params;

        await prisma.room.delete({ where: { id: parseInt(id) } });

        res.json({ message: 'ลบห้องสำเร็จ' });
    } catch (error) {
        console.error('Delete room error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการลบห้อง' });
    }
};

// Assign tenant to room
exports.assignTenant = async (req, res) => {
    try {
        const { id } = req.params;
        const { tenantId, depositAmount, contractDuration } = req.body;

        // Check if tenant exists
        const tenant = await prisma.user.findUnique({ where: { id: parseInt(tenantId) } });
        if (!tenant) {
            return res.status(404).json({ error: 'ไม่พบผู้เช่าที่ระบุ' });
        }

        // Check if tenant already has a room
        const existingRoom = await prisma.room.findFirst({ where: { tenantId: parseInt(tenantId) } });
        if (existingRoom) {
            return res.status(400).json({ error: 'ผู้เช่านี้มีห้องพักแล้ว' });
        }

        // Calculate Contract Dates
        const startDate = new Date();
        const durationMonths = parseInt(contractDuration) || 12; // Default 1 year
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + durationMonths);

        // Update Tenant Contract Info
        await prisma.user.update({
            where: { id: parseInt(tenantId) },
            data: {
                depositAmount: depositAmount ? parseFloat(depositAmount) : 0,
                contractStartDate: startDate,
                contractEndDate: endDate
            }
        });

        const room = await prisma.room.update({
            where: { id: parseInt(id) },
            data: {
                tenantId: parseInt(tenantId),
                status: 'OCCUPIED'
            },
            include: {
                tenant: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                }
            }
        });

        res.json({ message: 'มอบหมายผู้เช่าและบันทึกสัญญาสำเร็จ', room });
    } catch (error) {
        console.error('Assign tenant error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการมอบหมายผู้เช่า' });
    }
};

// Remove tenant from room
exports.removeTenant = async (req, res) => {
    try {
        const { id } = req.params;

        const room = await prisma.room.update({
            where: { id: parseInt(id) },
            data: {
                tenantId: null,
                status: 'AVAILABLE'
            }
        });

        res.json({ message: 'ย้ายผู้เช่าออกสำเร็จ', room });
    } catch (error) {
        console.error('Remove tenant error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการย้ายผู้เช่าออก' });
    }
};

// Get available tenants (users without room)
exports.getAvailableTenants = async (req, res) => {
    try {
        const tenants = await prisma.user.findMany({
            where: {
                role: 'TENANT',
                room: null
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true
            }
        });

        res.json(tenants);
    } catch (error) {
        console.error('Get available tenants error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงรายชื่อผู้เช่า' });
    }
};

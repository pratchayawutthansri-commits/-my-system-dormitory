const prisma = require('../utils/prisma');

// Get settings or create default
const getSettings = async () => {
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
    return settings;
};

// Record meter reading
exports.recordMeter = async (req, res) => {
    try {
        const { roomId, waterCurrent, electricCurrent } = req.body;

        if (!roomId || waterCurrent === undefined || electricCurrent === undefined) {
            return res.status(400).json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
        }

        // Get last reading
        const lastReading = await prisma.meterReading.findFirst({
            where: { roomId: parseInt(roomId) },
            orderBy: { readingDate: 'desc' }
        });

        const reading = await prisma.meterReading.create({
            data: {
                roomId: parseInt(roomId),
                waterPrevious: lastReading ? lastReading.waterCurrent : 0,
                waterCurrent: parseInt(waterCurrent),
                electricPrevious: lastReading ? lastReading.electricCurrent : 0,
                electricCurrent: parseInt(electricCurrent)
            }
        });

        res.status(201).json({ message: 'บันทึกค่ามิเตอร์สำเร็จ', reading });
    } catch (error) {
        console.error('Record meter error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการบันทึกค่ามิเตอร์' });
    }
};

// Generate invoice for a room
exports.generateInvoice = async (req, res) => {
    try {
        const { roomId, billingMonth } = req.body;

        const room = await prisma.room.findUnique({
            where: { id: parseInt(roomId) },
            include: { tenant: true }
        });

        if (!room) {
            return res.status(404).json({ error: 'ไม่พบห้องที่ระบุ' });
        }

        if (!room.tenant) {
            return res.status(400).json({ error: 'ห้องนี้ยังไม่มีผู้เช่า' });
        }

        // Get latest meter reading
        const latestReading = await prisma.meterReading.findFirst({
            where: { roomId: parseInt(roomId) },
            orderBy: { readingDate: 'desc' }
        });

        if (!latestReading) {
            return res.status(400).json({ error: 'ไม่พบข้อมูลมิเตอร์ กรุณาบันทึกค่ามิเตอร์ก่อน' });
        }

        // Check for existing invoice
        const billingDate = billingMonth ? new Date(billingMonth) : new Date();
        const startOfMonth = new Date(billingDate.getFullYear(), billingDate.getMonth(), 1);
        const endOfMonth = new Date(billingDate.getFullYear(), billingDate.getMonth() + 1, 0);

        const existingInvoice = await prisma.invoice.findFirst({
            where: {
                roomId: parseInt(roomId),
                billingMonth: {
                    gte: startOfMonth,
                    lte: endOfMonth
                }
            }
        });

        if (existingInvoice) {
            return res.status(400).json({ error: 'ห้องนี้มีการออกบิลรอบเดือนนี้ไปแล้ว' });
        }

        const settings = await getSettings();

        // Calculate amounts with Meter Reset Protection
        let waterUnits = latestReading.waterCurrent - latestReading.waterPrevious;
        let electricUnits = latestReading.electricCurrent - latestReading.electricPrevious;

        // Handle Meter Reset (If new meter reading is less than previous, assume reset and use current as total)
        if (waterUnits < 0) waterUnits = latestReading.waterCurrent;
        if (electricUnits < 0) electricUnits = latestReading.electricCurrent;

        const waterAmount = waterUnits * parseFloat(settings.waterRate);
        const electricAmount = electricUnits * parseFloat(settings.electricRate);
        const rentAmount = parseFloat(room.baseRent);
        const totalAmount = rentAmount + waterAmount + electricAmount;

        // Create invoice
        const dueDate = new Date(billingDate);
        dueDate.setDate(dueDate.getDate() + 7); // Due in 7 days

        const invoice = await prisma.invoice.create({
            data: {
                roomId: room.id,
                tenantId: room.tenant.id,
                rentAmount,
                waterUnits,
                waterAmount,
                electricUnits,
                electricAmount,
                totalAmount,
                billingMonth: billingDate,
                dueDate
            },
            include: {
                room: true,
                tenant: {
                    select: {
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                }
            }
        });


        res.status(201).json({ message: 'สร้างบิลสำเร็จ', invoice });
    } catch (error) {
        console.error('Generate invoice error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการสร้างบิล' });
    }
};

// Generate invoices for all occupied rooms
exports.generateAllInvoices = async (req, res) => {
    try {
        const { billingMonth } = req.body;
        const settings = await getSettings();

        const occupiedRooms = await prisma.room.findMany({
            where: { status: 'OCCUPIED', tenantId: { not: null } },
            include: { tenant: true }
        });

        const results = [];
        const errors = [];

        for (const room of occupiedRooms) {
            try {
                const latestReading = await prisma.meterReading.findFirst({
                    where: { roomId: room.id },
                    orderBy: { readingDate: 'desc' }
                });

                if (!latestReading) {
                    errors.push({ roomNumber: room.roomNumber, error: 'ไม่มีข้อมูลมิเตอร์' });
                    continue;
                }

                // Check for existing invoice
                const billingDate = billingMonth ? new Date(billingMonth) : new Date();
                const startOfMonth = new Date(billingDate.getFullYear(), billingDate.getMonth(), 1);
                const endOfMonth = new Date(billingDate.getFullYear(), billingDate.getMonth() + 1, 0);

                const existingInvoice = await prisma.invoice.findFirst({
                    where: {
                        roomId: room.id,
                        billingMonth: {
                            gte: startOfMonth,
                            lte: endOfMonth
                        }
                    }
                });

                if (existingInvoice) {
                    errors.push({ roomNumber: room.roomNumber, error: 'ห้องนี้มีการออกบิลรอบนี้แล้ว' });
                    continue;
                }

                let waterUnits = latestReading.waterCurrent - latestReading.waterPrevious;
                let electricUnits = latestReading.electricCurrent - latestReading.electricPrevious;

                // Handle Meter Reset logic for bulk invoice
                if (waterUnits < 0) waterUnits = latestReading.waterCurrent;
                if (electricUnits < 0) electricUnits = latestReading.electricCurrent;
                const waterAmount = waterUnits * parseFloat(settings.waterRate);
                const electricAmount = electricUnits * parseFloat(settings.electricRate);
                const rentAmount = parseFloat(room.baseRent);
                const totalAmount = rentAmount + waterAmount + electricAmount;

                // billingDate is already defined above for the check
                const dueDate = new Date(billingDate);
                dueDate.setDate(dueDate.getDate() + 7);

                const invoice = await prisma.invoice.create({
                    data: {
                        roomId: room.id,
                        tenantId: room.tenant.id,
                        rentAmount,
                        waterUnits,
                        waterAmount,
                        electricUnits,
                        electricAmount,
                        totalAmount,
                        billingMonth: billingDate,
                        dueDate
                    }
                });


                results.push({ roomNumber: room.roomNumber, invoice });
            } catch (err) {
                errors.push({ roomNumber: room.roomNumber, error: err.message });
            }
        }

        res.json({
            message: `สร้างบิลสำเร็จ ${results.length} ห้อง`,
            success: results,
            errors
        });
    } catch (error) {
        console.error('Generate all invoices error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการสร้างบิล' });
    }
};

// Get meter readings for a room
exports.getMeterReadings = async (req, res) => {
    try {
        const { roomId } = req.params;

        const readings = await prisma.meterReading.findMany({
            where: { roomId: parseInt(roomId) },
            orderBy: { readingDate: 'desc' },
            take: 12
        });

        res.json(readings);
    } catch (error) {
        console.error('Get meter readings error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูลมิเตอร์' });
    }
};

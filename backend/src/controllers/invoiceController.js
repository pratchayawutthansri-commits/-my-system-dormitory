const prisma = require('../utils/prisma');
const pdfService = require('../services/pdfService');
const logger = require('../utils/logger');

// Get all invoices (admin sees all, tenant sees own)
exports.getAll = async (req, res) => {
    try {
        const { status, month } = req.query;
        const where = {};

        // Tenant can only see their own invoices
        if (req.user.role === 'TENANT') {
            where.tenantId = req.user.id;
        }

        if (status) {
            where.status = status;
        }

        if (month) {
            const startDate = new Date(month);
            const endDate = new Date(startDate);
            endDate.setMonth(endDate.getMonth() + 1);
            where.billingMonth = {
                gte: startDate,
                lt: endDate
            };
        }

        const invoices = await prisma.invoice.findMany({
            where,
            include: {
                room: {
                    select: { roomNumber: true }
                },
                tenant: {
                    select: { firstName: true, lastName: true, email: true }
                }
            },
            orderBy: { billingMonth: 'desc' }
        });

        res.json(invoices);
    } catch (error) {
        logger.error('Get invoices error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูลบิล' });
    }
};

// Get single invoice
exports.getOne = async (req, res) => {
    try {
        const { id } = req.params;
        const invoice = await prisma.invoice.findUnique({
            where: { id: parseInt(id) },
            include: {
                room: true,
                tenant: {
                    select: { firstName: true, lastName: true, email: true, phone: true }
                }
            }
        });

        if (!invoice) {
            return res.status(404).json({ error: 'ไม่พบบิลที่ระบุ' });
        }

        // Tenant can only see their own invoice
        if (req.user.role === 'TENANT' && invoice.tenantId !== req.user.id) {
            return res.status(403).json({ error: 'ไม่มีสิทธิ์เข้าถึงบิลนี้' });
        }

        res.json(invoice);
    } catch (error) {
        logger.error('Get invoice error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูลบิล' });
    }
};

// Mark invoice as paid
exports.markPaid = async (req, res) => {
    try {
        const { id } = req.params;

        const invoice = await prisma.invoice.update({
            where: { id: parseInt(id) },
            data: {
                status: 'PAID',
                paidAt: new Date()
            }
        });

        res.json({ message: 'บันทึกการชำระเงินสำเร็จ', invoice });
    } catch (error) {
        logger.error('Mark paid error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการบันทึกการชำระเงิน' });
    }
};

// Delete invoice
exports.delete = async (req, res) => {
    try {
        const { id } = req.params;

        await prisma.invoice.delete({ where: { id: parseInt(id) } });

        res.json({ message: 'ลบบิลสำเร็จ' });
    } catch (error) {
        logger.error('Delete invoice error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการลบบิล' });
    }
};

// Update invoice
exports.update = async (req, res) => {
    try {
        const { id } = req.params;
        const { rentAmount, waterUnits, waterAmount, electricUnits, electricAmount, status, dueDate } = req.body;

        // Get current invoice to calculate total correctly
        const currentInvoice = await prisma.invoice.findUnique({ where: { id: parseInt(id) } });
        if (!currentInvoice) return res.status(404).json({ error: 'Not found' });

        // Calculate new values or use existing
        const newRent = rentAmount !== undefined ? parseFloat(rentAmount) : currentInvoice.rentAmount;
        const newWaterAmt = waterAmount !== undefined ? parseFloat(waterAmount) : currentInvoice.waterAmount;
        const newElectricAmt = electricAmount !== undefined ? parseFloat(electricAmount) : currentInvoice.electricAmount;

        // Auto-calculate Total
        const totalAmount = newRent + newWaterAmt + newElectricAmt;

        const invoice = await prisma.invoice.update({
            where: { id: parseInt(id) },
            data: {
                rentAmount: rentAmount ? parseFloat(rentAmount) : undefined,
                waterUnits: waterUnits ? parseInt(waterUnits) : undefined,
                waterAmount: waterAmount ? parseFloat(waterAmount) : undefined,
                electricUnits: electricUnits ? parseInt(electricUnits) : undefined,
                electricAmount: electricAmount ? parseFloat(electricAmount) : undefined,
                totalAmount, // Always use calculated total
                status: status || undefined,
                dueDate: dueDate ? new Date(dueDate) : undefined
            },
            include: {
                room: { select: { roomNumber: true } },
                tenant: { select: { firstName: true, lastName: true } }
            }
        });

        res.json({ message: 'อัพเดทบิลสำเร็จ', invoice });
    } catch (error) {
        logger.error('Update invoice error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการอัพเดทบิล' });
    }
};

// Upload slip
exports.uploadSlip = async (req, res) => {
    try {
        const { id } = req.params;
        const { slipImage } = req.body;

        console.log(`[Invoice] Upload slip for ID: ${id}`);

        if (isNaN(parseInt(id))) {
            return res.status(400).json({ error: 'Invalid Invoice ID' });
        }

        if (!slipImage) {
            return res.status(400).json({ error: 'กรุณาแนบรูปสลิป' });
        }

        const invoice = await prisma.invoice.update({
            where: { id: parseInt(id) },
            data: {
                slipImage,
                status: 'VERIFYING'
            },
            include: {
                room: { select: { roomNumber: true } },
                tenant: { select: { firstName: true } }
            }
        });

        console.log(`[Invoice] Slip uploaded for invoice ${id}, status set to VERIFYING`);

        res.json({ message: 'อัพโหลดสลิปสำเร็จ', invoice });
    } catch (error) {
        console.error('[Invoice] Upload slip error:', error);
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'ไม่พบบิลนี้ในระบบ' });
        }
        res.status(500).json({ error: error.message || 'เกิดข้อผิดพลาดในการอัพโหลดสลิป' });
    }
};

// Download Invoice PDF
exports.downloadInvoicePDF = async (req, res) => {
    try {
        const { id } = req.params;
        const tenantId = req.user.id; // From auth middleware

        // Fetch invoice with all relations
        const invoice = await prisma.invoice.findUnique({
            where: { id: parseInt(id) },
            include: {
                room: true,
                tenant: true
            }
        });

        if (!invoice) {
            return res.status(404).json({ error: 'ไม่พบบิลที่ระบุ' });
        }

        // Security check: Only own invoices or Admin
        if (req.user.role !== 'ADMIN' && invoice.tenantId !== tenantId) {
            return res.status(403).json({ error: 'ไม่มีสิทธิ์เข้าถึงบิลนี้' });
        }

        const settings = await prisma.settings.findFirst();

        // Generate PDF
        pdfService.generateInvoicePDF(invoice, settings, res);

    } catch (error) {
        logger.error('Download PDF error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการสร้างไฟล์ PDF' });
    }
};

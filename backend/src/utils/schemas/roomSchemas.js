const { z } = require('zod');

exports.roomSchema = z.object({
    roomNumber: z.string({ required_error: 'กรุณาระบุเลขห้อง' }),
    baseRent: z.number({ required_error: 'กรุณาระบุค่าเช่าพื้นฐาน' }).min(0),
    floor: z.number().int().min(1).optional(),
    status: z.enum(['AVAILABLE', 'OCCUPIED', 'MAINTENANCE']).optional()
});

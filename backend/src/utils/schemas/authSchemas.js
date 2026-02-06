const { z } = require('zod');

const registerSchema = z.object({
    email: z.string()
        .min(1, { message: "กรุณาระบุอีเมล" })
        .email({ message: "รูปแบบอีเมลไม่ถูกต้อง" }),
    password: z.string()
        .min(6, { message: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร" }),
    firstName: z.string()
        .min(1, { message: "กรุณาระบุชื่อ" }),
    lastName: z.string()
        .min(1, { message: "กรุณาระบุนามสกุล" }),
    phone: z.string().optional(),
    role: z.enum(['ADMIN', 'TENANT']).optional().default('TENANT')
});

const loginSchema = z.object({
    email: z.string()
        .min(1, { message: "กรุณาระบุอีเมล" })
        .email({ message: "รูปแบบอีเมลไม่ถูกต้อง" }),
    password: z.string()
        .min(1, { message: "กรุณาระบุรหัสผ่าน" })
});

module.exports = {
    registerSchema,
    loginSchema
};

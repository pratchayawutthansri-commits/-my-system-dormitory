const winston = require('winston');
const path = require('path');

// กำหนดรูปแบบ Log
const logFormat = winston.format.printf(({ level, message, timestamp, stack }) => {
    return `${timestamp} ${level}: ${stack || message}`;
});

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }), // บันทึก Error Log แบบละเอียด
        winston.format.json()
    ),
    defaultMeta: { service: 'dormitory-api' },
    transports: [
        // 1. บันทึก Error ลงไฟล์ logs/error.log
        new winston.transports.File({
            filename: path.join(__dirname, '../../logs/error.log'),
            level: 'error'
        }),
        // 2. บันทึกทุกอย่างลงไฟล์ logs/combined.log
        new winston.transports.File({
            filename: path.join(__dirname, '../../logs/combined.log')
        })
    ]
});

// ถ้าไม่ได้อยู่บน Server จริง (Production) ให้แสดงผลใน Terminal สวยๆ ด้วย
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(), // ใส่สีให้ดูง่าย
            winston.format.simple()
        )
    }));
}

module.exports = logger;

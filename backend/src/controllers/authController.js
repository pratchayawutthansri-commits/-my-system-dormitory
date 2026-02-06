const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');
const logger = require('../utils/logger'); // Import logger

// Generate tokens
const generateTokens = (user) => {
    // ... existing code ...
    const accessToken = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
    );

    const refreshToken = jwt.sign(
        { id: user.id },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );

    return { accessToken, refreshToken };
};

// Register
exports.register = async (req, res) => {
    try {
        const { email, password, firstName, lastName, phone } = req.body;

        // Validation
        if (!email || !password || !firstName || !lastName) {
            return res.status(400).json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
        }

        if (phone && !/^[0-9]{9,10}$/.test(phone.replace(/-/g, ''))) {
            return res.status(400).json({ error: 'เบอร์โทรศัพท์ไม่ถูกต้อง' });
        }

        // Check if user exists
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'อีเมลนี้ถูกใช้งานแล้ว' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create user - Force role to TENANT for security
        // To create ADMIN, please query database manually or use a specific admin seed script
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                firstName,
                lastName,
                phone,
                role: 'TENANT'
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true
            }
        });

        const tokens = generateTokens(user);

        res.status(201).json({
            message: 'ลงทะเบียนสำเร็จ',
            user,
            ...tokens
        });
    } catch (error) {
        logger.error(`Register error: ${error.message}`, { stack: error.stack });
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการลงทะเบียน' });
    }
};

// Login
exports.login = async (req, res) => {
    try {
        console.log('Login attempt:', req.body.email);
        const { email, password } = req.body;

        // Find user with room
        const user = await prisma.user.findUnique({
            where: { email },
            include: {
                room: {
                    select: {
                        id: true,
                        roomNumber: true,
                        baseRent: true
                    }
                }
            }
        });
        if (!user) {
            return res.status(401).json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
        }

        const tokens = generateTokens(user);

        res.json({
            message: 'เข้าสู่ระบบสำเร็จ',
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                room: user.room
            },
            ...tokens
        });
    } catch (error) {
        console.error('LOGIN CRASH:', error); // FORCE CONSOLE OUTPUT
        logger.error(`Login error: ${error.message}`, { stack: error.stack });
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ กรุณาลองใหม่อีกครั้ง' });
    }
};

// Refresh token
exports.refresh = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({ error: 'Refresh token required' });
        }

        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        const user = await prisma.user.findUnique({ where: { id: decoded.id } });

        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        const tokens = generateTokens(user);
        res.json(tokens);
    } catch (error) {
        // Token verification errors don't need error logging usually, but let's log info
        res.status(401).json({ error: 'Invalid refresh token' });
    }
};

// Get current user
exports.me = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
                role: true,
                createdAt: true,
                room: {
                    select: {
                        id: true,
                        roomNumber: true,
                        baseRent: true
                    }
                }
            }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        logger.error(`Get ME error: ${error.message}`, { stack: error.stack });
        res.status(500).json({ error: 'Error fetching user data' });
    }
};

const express = require('express');
const router = express.Router();
// const rateLimit = require('express-rate-limit'); // Commented out
const { authenticateToken } = require('../middleware/auth');
const authController = require('../controllers/authController');
const validate = require('../middleware/validate');
const { registerSchema, loginSchema } = require('../utils/schemas/authSchemas');

/*
// Auth-specific rate limiter (stricter for security)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
    message: { error: 'พยายาม login/register มากเกินไป กรุณารอ 15 นาที' },
    standardHeaders: true,
    legacyHeaders: false
});
*/

// Routes WITHOUT rate limiting (Temporary Disabled)
router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh', authController.refresh);
router.get('/me', authenticateToken, authController.me);

module.exports = router;

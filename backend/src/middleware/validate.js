const logger = require('../utils/logger');

const validate = (schema) => (req, res, next) => {
    try {
        // Validate request body
        const validatedBody = schema.parse(req.body);

        // Replace req.body with validated and sanitized data
        req.body = validatedBody;

        next();
    } catch (error) {
        if (error.name === 'ZodError' && error.errors) {
            const errorMessages = error.errors.map((err) => ({
                field: err.path?.[0] || 'unknown',
                message: err.message,
            }));

            logger.info('Validation failed', { errors: errorMessages });

            return res.status(400).json({
                error: 'ข้อมูลไม่ถูกต้อง',
                details: errorMessages
            });
        }

        // Log and return generic error if not a ZodError
        logger.error('Validation middleware error:', { error: error.message, stack: error.stack });
        return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการตรวจสอบข้อมูล' });
    }
};

module.exports = validate;

module.exports = validate;

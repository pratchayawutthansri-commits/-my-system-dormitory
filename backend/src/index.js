require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const logger = require('./utils/logger');
const { authenticateToken, isAdmin } = require('./middleware/auth'); // Import missing middleware

const authRoutes = require('./routes/auth');
const roomRoutes = require('./routes/rooms');
const invoiceRoutes = require('./routes/invoices');
const billingRoutes = require('./routes/billing');
const reportRoutes = require('./routes/reports');
const settingsRoutes = require('./routes/settings');
const maintenanceRoutes = require('./routes/maintenance');
const announcementRoutes = require('./routes/announcements');

const app = express();
const expenseController = require('./controllers/expenseController');

// Expense Routes moved below middleware

const PORT = process.env.PORT || 5000;

// Security Headers - Move to top
app.use(helmet());

// CORS Configuration
const corsOptions = {
    origin: process.env.NODE_ENV === 'production'
        ? process.env.FRONTEND_URL || 'http://localhost:3000'
        : ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true,
    optionsSuccessStatus: 200
};

// Global Rate Limiter
const globalLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 100,
    message: { error: 'ส่งคำขอมากเกินไป กรุณารอสักครู่' }
});

// Middleware
app.use(globalLimiter);
app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.get('/api/expenses', authenticateToken, isAdmin, expenseController.getAllExpenses);
app.post('/api/expenses', authenticateToken, isAdmin, expenseController.createExpense);
app.delete('/api/expenses/:id', authenticateToken, isAdmin, expenseController.deleteExpense);
app.get('/api/expenses/summary', authenticateToken, isAdmin, expenseController.getSummary);

app.use('/api/announcements', announcementRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Dormitory API is running' });
});

// Root route
app.get('/', (req, res) => {
    res.json({
        name: 'Dormitory Management API',
        version: '1.0.0',
        status: 'running'
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('🔥 Server Error:', err);
    logger.error(err.stack);
    res.status(500).json({
        error: err.message || 'Something went wrong!',
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

app.listen(PORT, () => {
    logger.info(`🏠 Dormitory API Server running on port ${PORT}`);

    // Initialize cron jobs for automated tasks
    const { initCronJobs } = require('./services/cronService');
    initCronJobs();
});

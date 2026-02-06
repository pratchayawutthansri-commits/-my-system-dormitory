const cron = require('node-cron');
const prisma = require('../utils/prisma');
const logger = require('../utils/logger');

// ===== Cron Jobs Configuration =====

/**
 * Job 1: Mark overdue invoices
 * Runs daily at midnight (00:00)
 * Updates PENDING invoices past due date to OVERDUE status
 */
const markOverdueInvoices = () => {
    cron.schedule('0 0 * * *', async () => {
        try {
            const now = new Date();

            const result = await prisma.invoice.updateMany({
                where: {
                    status: 'PENDING',
                    dueDate: { lt: now }
                },
                data: { status: 'OVERDUE' }
            });

            if (result.count > 0) {
                logger.info(`[Cron] Marked ${result.count} invoices as OVERDUE`);
            }
        } catch (error) {
            logger.error('[Cron] Error marking overdue invoices:', error);
        }
    }, {
        scheduled: true,
        timezone: 'Asia/Bangkok'
    });

    logger.info('[Cron] Overdue invoice checker scheduled (daily at midnight)');
};

/**
 * Job 2: Contract expiration reminder (runs every day at 9 AM)
 * Check contracts expiring within 30 days
 */
const checkContractExpiration = () => {
    cron.schedule('0 9 * * *', async () => {
        try {
            const thirtyDaysFromNow = new Date();
            thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

            const expiringContracts = await prisma.user.findMany({
                where: {
                    role: 'TENANT',
                    contractEndDate: {
                        lte: thirtyDaysFromNow,
                        gte: new Date()
                    },
                    room: { isNot: null }
                },
                include: {
                    room: { select: { roomNumber: true } }
                }
            });

            if (expiringContracts.length > 0) {
                // Log expiring contracts (notification system disabled)
                for (const tenant of expiringContracts) {
                    const daysLeft = Math.ceil((new Date(tenant.contractEndDate) - new Date()) / (1000 * 60 * 60 * 24));
                    logger.info(`[Cron] Contract expiring: Room ${tenant.room?.roomNumber}, Tenant: ${tenant.firstName} ${tenant.lastName}, Days left: ${daysLeft}`);
                }
            }
        } catch (error) {
            logger.error('[Cron] Error checking contract expiration:', error);
        }
    }, {
        scheduled: true,
        timezone: 'Asia/Bangkok'
    });

    logger.info('[Cron] Contract expiration checker scheduled (daily at 9 AM)');
};

/**
 * Initialize all cron jobs
 */
const initCronJobs = () => {
    logger.info('[Cron] Initializing scheduled jobs...');
    markOverdueInvoices();
    checkContractExpiration();
    logger.info('[Cron] All cron jobs initialized successfully');
};

module.exports = { initCronJobs };

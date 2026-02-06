const prisma = require('../utils/prisma');

// Monthly income report
exports.monthlyReport = async (req, res) => {
    try {
        const { year, month } = req.query;

        const targetYear = year ? parseInt(year) : new Date().getFullYear();
        const targetMonth = month ? parseInt(month) - 1 : new Date().getMonth();

        const startDate = new Date(targetYear, targetMonth, 1);
        const endDate = new Date(targetYear, targetMonth + 1, 0);

        const invoices = await prisma.invoice.findMany({
            where: {
                billingMonth: {
                    gte: startDate,
                    lte: endDate
                }
            },
            include: {
                room: { select: { roomNumber: true } },
                tenant: { select: { firstName: true, lastName: true } }
            }
        });

        const summary = {
            totalRent: 0,
            totalWater: 0,
            totalElectric: 0,
            totalIncome: 0,
            paidCount: 0,
            pendingCount: 0,
            overdueCount: 0
        };

        invoices.forEach(inv => {
            summary.totalRent += parseFloat(inv.rentAmount);
            summary.totalWater += parseFloat(inv.waterAmount);
            summary.totalElectric += parseFloat(inv.electricAmount);
            summary.totalIncome += parseFloat(inv.totalAmount);

            if (inv.status === 'PAID') summary.paidCount++;
            else if (inv.status === 'PENDING') summary.pendingCount++;
            else if (inv.status === 'OVERDUE') summary.overdueCount++;
        });

        res.json({
            period: { year: targetYear, month: targetMonth + 1 },
            summary,
            invoices
        });
    } catch (error) {
        console.error('Monthly report error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการสร้างรายงาน' });
    }
};

// Income summary (dashboard data)
exports.incomeSummary = async (req, res) => {
    try {
        // Current month stats
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        // Use aggregates for better performance (no need to load all invoices to memory)
        const [
            totalRooms,
            occupiedRooms,
            availableRooms,
            maintenanceRooms,
            currentMonthTotalAggregate,
            currentMonthPaidAggregate,
            pendingInvoices,
            allInvoicesLast6Months
        ] = await Promise.all([
            prisma.room.count(),
            prisma.room.count({ where: { status: 'OCCUPIED' } }),
            prisma.room.count({ where: { status: 'AVAILABLE' } }),
            prisma.room.count({ where: { status: 'MAINTENANCE' } }),
            // Aggregate: Total income this month
            prisma.invoice.aggregate({
                where: { billingMonth: { gte: startOfMonth, lte: endOfMonth } },
                _sum: { totalAmount: true }
            }),
            // Aggregate: Paid amount this month
            prisma.invoice.aggregate({
                where: { billingMonth: { gte: startOfMonth, lte: endOfMonth }, status: 'PAID' },
                _sum: { totalAmount: true }
            }),
            prisma.invoice.count({ where: { status: 'PENDING' } }),
            // Get only necessary fields for last 6 months chart
            prisma.invoice.findMany({
                where: {
                    status: 'PAID',
                    billingMonth: {
                        gte: new Date(now.getFullYear(), now.getMonth() - 5, 1)
                    }
                },
                select: {
                    billingMonth: true,
                    totalAmount: true
                }
            })
        ]);

        // Calculate current month totals from aggregates (much faster)
        const totalIncome = parseFloat(currentMonthTotalAggregate._sum.totalAmount || 0);
        const paidAmount = parseFloat(currentMonthPaidAggregate._sum.totalAmount || 0);
        const currentMonthStats = {
            totalIncome,
            paidAmount,
            pendingAmount: totalIncome - paidAmount
        };

        // Generate last 6 months array with proper labels (sorted oldest to newest)
        const months = [];
        for (let i = 5; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            months.push({
                year: date.getFullYear(),
                month: date.getMonth(),
                sortOrder: (date.getFullYear() * 12) + date.getMonth(),
                label: date.toLocaleDateString('th-TH', { month: 'short', year: '2-digit' }),
                income: 0
            });
        }

        // Aggregate invoices by month
        allInvoicesLast6Months.forEach(inv => {
            const invDate = new Date(inv.billingMonth);
            const invYear = invDate.getFullYear();
            const invMonth = invDate.getMonth();

            const monthData = months.find(m => m.year === invYear && m.month === invMonth);
            if (monthData) {
                monthData.income += parseFloat(inv.totalAmount);
            }
        });

        // Sort by date (oldest first) and format for chart
        const monthlyData = months
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map(m => ({
                label: m.label,
                income: m.income
            }));

        // Logic for "Tactical Command Center" metrics
        const [latestMaintenance, latestInvoices, latestTenants, verificationCount] = await Promise.all([
            prisma.maintenanceRequest.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
                include: { room: { select: { roomNumber: true } } }
            }),
            prisma.invoice.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
                include: { room: { select: { roomNumber: true } }, tenant: { select: { firstName: true } } }
            }),
            prisma.user.findMany({
                where: { role: 'TENANT' },
                take: 5,
                orderBy: { createdAt: 'desc' }
            }),
            prisma.invoice.count({
                where: {
                    status: 'PENDING',
                    slipImage: { not: null }
                }
            })
        ]);

        // Combine into a single activity feed
        const activities = [
            ...latestMaintenance.map(m => ({
                id: `m-${m.id}`,
                type: 'MAINTENANCE',
                message: `แจ้งซ่อมใหม่: ${m.title}`,
                subtext: `ห้อง ${m.room.roomNumber}`,
                time: m.createdAt
            })),
            ...latestInvoices.map(inv => ({
                id: `i-${inv.id}`,
                type: 'INVOICE',
                message: `บิลรอบใหม่ถูกสร้าง: ${inv.tenant.firstName}`,
                subtext: `ห้อง ${inv.room.roomNumber} - ${inv.totalAmount}฿`,
                time: inv.createdAt
            })),
            ...latestTenants.map(t => ({
                id: `t-${t.id}`,
                type: 'TENANT',
                message: `ผู้เช่าใหม่ลงทะเบียน: ${t.firstName}`,
                subtext: t.email,
                time: t.createdAt
            }))
        ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 8);

        // Collection Rate calculation
        const collectionRate = currentMonthStats.totalIncome > 0
            ? Math.round((currentMonthStats.paidAmount / currentMonthStats.totalIncome) * 100)
            : 0;

        res.json({
            rooms: {
                total: totalRooms,
                occupied: occupiedRooms,
                available: availableRooms,
                maintenance: maintenanceRooms,
                occupancyRate: totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0
            },
            currentMonth: {
                ...currentMonthStats,
                collectionRate
            },
            pendingInvoices,
            verificationQueue: verificationCount,
            latestActivities: activities,
            monthlyChart: monthlyData
        });
    } catch (error) {
        console.error('Income summary error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูลสรุป' });
    }
};


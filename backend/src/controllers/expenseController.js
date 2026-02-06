const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getAllExpenses = async (req, res) => {
    try {
        const expenses = await prisma.expense.findMany({
            orderBy: { date: 'desc' }
        });
        res.json(expenses);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch expenses' });
    }
};

exports.createExpense = async (req, res) => {
    try {
        const { title, amount, category, description, date } = req.body;
        const expense = await prisma.expense.create({
            data: {
                title,
                amount: parseFloat(amount),
                category,
                description,
                date: date ? new Date(date) : new Date()
            }
        });
        res.json(expense);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create expense' });
    }
};

exports.deleteExpense = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.expense.delete({
            where: { id: parseInt(id) }
        });
        res.json({ message: 'Expense deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete expense' });
    }
};

exports.getSummary = async (req, res) => {
    try {
        const { month, year } = req.query; // Optional filters

        const startDate = new Date(year || new Date().getFullYear(), month ? parseInt(month) - 1 : 0, 1);
        const endDate = new Date(year || new Date().getFullYear(), month ? parseInt(month) : 12, 0);

        const expenses = await prisma.expense.aggregate({
            _sum: { amount: true },
            where: {
                date: {
                    gte: startDate,
                    lte: endDate
                }
            }
        });

        const income = await prisma.invoice.aggregate({
            _sum: { totalAmount: true },
            where: {
                status: 'PAID',
                paidAt: {
                    gte: startDate,
                    lte: endDate
                }
            }
        });

        res.json({
            totalExpenses: expenses._sum.amount || 0,
            totalIncome: income._sum.totalAmount || 0,
            netProfit: (income._sum.totalAmount || 0) - (expenses._sum.amount || 0)
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get summary' });
    }
};

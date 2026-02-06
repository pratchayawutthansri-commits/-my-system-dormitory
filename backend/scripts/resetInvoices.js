const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function resetInvoices() {
    try {
        console.log('🗑️  กำลังลบ Invoice ทั้งหมด...');

        const result = await prisma.invoice.deleteMany({});

        console.log(`✅ ลบ Invoice สำเร็จ: ${result.count} รายการ`);
        console.log('📊 ข้อมูลรายได้ถูก reset เรียบร้อยแล้ว');

    } catch (error) {
        console.error('❌ เกิดข้อผิดพลาด:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

resetInvoices();

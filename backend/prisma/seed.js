const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting seed...');

    // Create settings
    const settings = await prisma.settings.upsert({
        where: { id: 1 },
        update: {},
        create: {
            dormName: 'หอพักสุขสันต์',
            address: '123 ถนนสุขใจ แขวงสุขสบาย เขตสุขเกษม กรุงเทพฯ 10100',
            waterRate: 18,
            electricRate: 8
        }
    });
    console.log('✅ Settings created');

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 12);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@dormitory.com' },
        update: {},
        create: {
            email: 'admin@dormitory.com',
            password: adminPassword,
            firstName: 'แอดมิน',
            lastName: 'ผู้จัดการ',
            phone: '0891234567',
            role: 'ADMIN'
        }
    });
    console.log('✅ Admin user created:', admin.email);

    // Create sample tenants
    const tenantPassword = await bcrypt.hash('tenant123', 12);
    const tenants = [];

    const tenantData = [
        { email: 'somchai@email.com', firstName: 'สมชาย', lastName: 'ใจดี', phone: '0812345678' },
        { email: 'somying@email.com', firstName: 'สมหญิง', lastName: 'รักเรียน', phone: '0823456789' },
        { email: 'somsak@email.com', firstName: 'สมศักดิ์', lastName: 'มานะ', phone: '0834567890' }
    ];

    for (const data of tenantData) {
        const tenant = await prisma.user.upsert({
            where: { email: data.email },
            update: {},
            create: {
                ...data,
                password: tenantPassword,
                role: 'TENANT'
            }
        });
        tenants.push(tenant);
    }
    console.log('✅ Tenant users created');

    // Create sample rooms
    const rooms = [];
    const roomData = [
        { roomNumber: '101', baseRent: 3500, floor: 1 },
        { roomNumber: '102', baseRent: 3500, floor: 1 },
        { roomNumber: '103', baseRent: 3800, floor: 1 },
        { roomNumber: '201', baseRent: 4000, floor: 2 },
        { roomNumber: '202', baseRent: 4000, floor: 2 },
        { roomNumber: '203', baseRent: 4200, floor: 2 },
        { roomNumber: '301', baseRent: 4500, floor: 3 },
        { roomNumber: '302', baseRent: 4500, floor: 3 }
    ];

    for (const data of roomData) {
        const room = await prisma.room.upsert({
            where: { roomNumber: data.roomNumber },
            update: {},
            create: data
        });
        rooms.push(room);
    }
    console.log('✅ Rooms created');

    // Assign some tenants to rooms
    await prisma.room.update({
        where: { roomNumber: '101' },
        data: { tenantId: tenants[0].id, status: 'OCCUPIED' }
    });

    await prisma.room.update({
        where: { roomNumber: '201' },
        data: { tenantId: tenants[1].id, status: 'OCCUPIED' }
    });

    await prisma.room.update({
        where: { roomNumber: '301' },
        data: { tenantId: tenants[2].id, status: 'OCCUPIED' }
    });
    console.log('✅ Tenants assigned to rooms');

    // Add meter readings for occupied rooms
    const occupiedRooms = await prisma.room.findMany({
        where: { status: 'OCCUPIED' }
    });

    for (const room of occupiedRooms) {
        await prisma.meterReading.create({
            data: {
                roomId: room.id,
                waterPrevious: 0,
                waterCurrent: Math.floor(Math.random() * 10) + 5,
                electricPrevious: 0,
                electricCurrent: Math.floor(Math.random() * 100) + 50
            }
        });
    }
    console.log('✅ Meter readings added');

    console.log('🎉 Seed completed successfully!');
    console.log('\n📋 Test Accounts:');
    console.log('   Admin: admin@dormitory.com / admin123');
    console.log('   Tenant: somchai@email.com / tenant123');
}

main()
    .catch((e) => {
        console.error('❌ Seed error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

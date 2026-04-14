const { PrismaLibSql } = require('@prisma/adapter-libsql');
const { PrismaClient } = require('@prisma/client');
const adapter = new PrismaLibSql({ url: 'file:./dev.db' });
const prisma = new PrismaClient({ adapter });

async function seed() {
  const entries = [
    { roomNumber: '101', cardUid: 'MASTER123', cardType: 'MASTER', accessGranted: true, reason: null },
    { roomNumber: '102', cardUid: 'ABCD1234', cardType: 'CUSTOMER', accessGranted: true, reason: null },
    { roomNumber: '103', cardUid: 'XXXX9999', cardType: 'UNKNOWN', accessGranted: false, reason: 'no active booking' },
    { roomNumber: '102', cardUid: 'MANAGE01', cardType: 'MANAGER', accessGranted: true, reason: null },
    { roomNumber: '101', cardUid: 'BADCARD1', cardType: 'UNKNOWN', accessGranted: false, reason: 'invalid card for this room' },
    { roomNumber: '104', cardUid: 'ABCD5678', cardType: 'CUSTOMER', accessGranted: false, reason: 'expired' },
  ];
  for (const e of entries) {
    await prisma.scanLog.create({ data: e });
  }
  console.log('Seeded scan logs OK');
  await prisma.$disconnect();
}

seed().catch(e => { console.error(e); process.exit(1); });

const { createClient } = require('@libsql/client');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const db = createClient({
  url: process.env.DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN
});

async function setup() {
  console.log('--- STARTING MULTI-TENANT DATABASE MIGRATION ---');

  console.log('Dropping existing tables...');
  await db.execute('PRAGMA foreign_keys = OFF');
  const tables = [
    'RoomOccupancyLog',
    'RoomSensor',
    'BedLog',
    'BedSensor',
    'ScanLog',
    'MasterCard',
    'Booking',
    'Room',
    'User',
    'Lodge'
  ];
  for (const table of tables) {
    try {
      await db.execute(`DROP TABLE IF EXISTS "${table}"`);
      console.log(`Dropped table: ${table}`);
    } catch (e) {
      console.log(`Failed to drop table ${table}:`, e.message);
    }
  }

  console.log('\nCreating new multi-tenant tables...');

  // 1. Lodge Table
  await db.execute(`CREATE TABLE "Lodge" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "name" TEXT NOT NULL,
      "code" TEXT NOT NULL,
      "apiKey" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);
  await db.execute(`CREATE UNIQUE INDEX "Lodge_code_key" ON "Lodge"("code")`);
  await db.execute(`CREATE UNIQUE INDEX "Lodge_apiKey_key" ON "Lodge"("apiKey")`);
  console.log('Created Lodge table');

  // 2. User Table
  await db.execute(`CREATE TABLE "User" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "name" TEXT NOT NULL,
      "email" TEXT NOT NULL,
      "password" TEXT NOT NULL,
      "role" TEXT NOT NULL DEFAULT 'LODGE_ADMIN',
      "lodgeId" INTEGER,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY ("lodgeId") REFERENCES "Lodge" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`);
  await db.execute(`CREATE UNIQUE INDEX "User_email_key" ON "User"("email")`);
  console.log('Created User table');

  // 3. Room Table
  await db.execute(`CREATE TABLE "Room" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "number" TEXT NOT NULL,
      "lodgeId" INTEGER NOT NULL,
      FOREIGN KEY ("lodgeId") REFERENCES "Lodge" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`);
  await db.execute(`CREATE UNIQUE INDEX "Room_number_lodgeId_key" ON "Room"("number", "lodgeId")`);
  console.log('Created Room table');

  // 4. Booking Table
  await db.execute(`CREATE TABLE "Booking" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "roomId" INTEGER NOT NULL,
      "customerName" TEXT NOT NULL,
      "customerCardUid" TEXT NOT NULL,
      "managerCardUid" TEXT NOT NULL,
      "startTime" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "endTime" DATETIME NOT NULL,
      "isActive" BOOLEAN NOT NULL DEFAULT true,
      FOREIGN KEY ("roomId") REFERENCES "Room" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`);
  console.log('Created Booking table');

  // 5. MasterCard Table
  await db.execute(`CREATE TABLE "MasterCard" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "uid" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "lodgeId" INTEGER NOT NULL,
      FOREIGN KEY ("lodgeId") REFERENCES "Lodge" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`);
  await db.execute(`CREATE UNIQUE INDEX "MasterCard_uid_lodgeId_key" ON "MasterCard"("uid", "lodgeId")`);
  console.log('Created MasterCard table');

  // 6. ScanLog Table
  await db.execute(`CREATE TABLE "ScanLog" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "roomNumber" TEXT NOT NULL,
      "cardUid" TEXT NOT NULL,
      "cardType" TEXT NOT NULL,
      "accessGranted" BOOLEAN NOT NULL,
      "reason" TEXT,
      "lodgeId" INTEGER NOT NULL,
      "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY ("lodgeId") REFERENCES "Lodge" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`);
  console.log('Created ScanLog table');

  // 7. BedSensor Table
  await db.execute(`CREATE TABLE "BedSensor" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "roomId" INTEGER NOT NULL,
      "weight" REAL NOT NULL DEFAULT 0,
      "isOccupied" BOOLEAN NOT NULL DEFAULT false,
      "lastUpdate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY ("roomId") REFERENCES "Room" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`);
  await db.execute(`CREATE UNIQUE INDEX "BedSensor_roomId_key" ON "BedSensor"("roomId")`);
  console.log('Created BedSensor table');

  // 8. BedLog Table
  await db.execute(`CREATE TABLE "BedLog" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "roomId" INTEGER NOT NULL,
      "occupiedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "vacatedAt" DATETIME,
      "durationStr" TEXT
  )`);
  console.log('Created BedLog table');

  // 9. RoomSensor Table
  await db.execute(`CREATE TABLE "RoomSensor" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "roomId" INTEGER NOT NULL,
      "isOccupied" BOOLEAN NOT NULL DEFAULT false,
      "pirTriggered" BOOLEAN NOT NULL DEFAULT false,
      "radarPresence" BOOLEAN NOT NULL DEFAULT false,
      "movingDistance" REAL NOT NULL DEFAULT 0,
      "stationaryDistance" REAL NOT NULL DEFAULT 0,
      "lastUpdate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY ("roomId") REFERENCES "Room" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`);
  await db.execute(`CREATE UNIQUE INDEX "RoomSensor_roomId_key" ON "RoomSensor"("roomId")`);
  console.log('Created RoomSensor table');

  // 10. RoomOccupancyLog Table
  await db.execute(`CREATE TABLE "RoomOccupancyLog" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "roomId" INTEGER NOT NULL,
      "occupiedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "vacatedAt" DATETIME,
      "durationStr" TEXT
  )`);
  console.log('Created RoomOccupancyLog table');

  console.log('\nSeeding initial multi-tenant data...');

  // A. Create default super admin
  const hashedSuperAdminPassword = await bcrypt.hash('admin123', 12);
  await db.execute({
    sql: 'INSERT INTO "User" ("name", "email", "password", "role", "lodgeId") VALUES (?, ?, ?, ?, ?)',
    args: ['Super Admin Owner', 'admin@lodge.com', hashedSuperAdminPassword, 'SUPER_ADMIN', null]
  });
  console.log('Seeded SUPER_ADMIN user: admin@lodge.com / admin123');

  // B. Create default lodge
  await db.execute({
    sql: 'INSERT INTO "Lodge" ("name", "code", "apiKey") VALUES (?, ?, ?)',
    args: ['Cascade Lodge', 'cascade', 'cascade_key_123']
  });
  const lodgeResult = await db.execute("SELECT id FROM Lodge WHERE code = 'cascade'");
  const lodgeId = Number(lodgeResult.rows[0].id);
  console.log(`Seeded Lodge "Cascade Lodge" (ID: ${lodgeId}) with API Key: cascade_key_123`);

  // C. Create default lodge manager user
  const hashedManagerPassword = await bcrypt.hash('manager123', 12);
  await db.execute({
    sql: 'INSERT INTO "User" ("name", "email", "password", "role", "lodgeId") VALUES (?, ?, ?, ?, ?)',
    args: ['Cascade Manager', 'manager@cascade.com', hashedManagerPassword, 'LODGE_ADMIN', lodgeId]
  });
  console.log('Seeded LODGE_ADMIN user: manager@cascade.com / manager123');

  // D. Create default rooms for Cascade Lodge
  const rooms = ['101', '102', '103', '104', '105'];
  for (const number of rooms) {
    await db.execute({
      sql: 'INSERT INTO "Room" ("number", "lodgeId") VALUES (?, ?)',
      args: [number, lodgeId]
    });
  }
  console.log(`Seeded rooms [${rooms.join(', ')}] for Cascade Lodge`);

  // E. Create default master card for Cascade Lodge
  await db.execute({
    sql: 'INSERT INTO "MasterCard" ("uid", "name", "lodgeId") VALUES (?, ?, ?)',
    args: ['MASTER123', 'Cascade Master Card', lodgeId]
  });
  console.log('Seeded MasterCard "MASTER123" for Cascade Lodge');

  await db.execute('PRAGMA foreign_keys = ON');
  console.log('\n--- MULTI-TENANT DATABASE SETUP COMPLETED SUCCESSFULLY 🎉 ---');
  db.close();
}

setup().catch((err) => {
  console.error('Migration setup failed:', err);
  process.exit(1);
});

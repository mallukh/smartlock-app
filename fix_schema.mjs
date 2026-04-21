import { createClient } from '@libsql/client';

const db = createClient({
  url: 'libsql://smartlock-mallukh.aws-ap-south-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzYyNDAzNzgsImlkIjoiMDE5ZDkwMmMtM2IwMS03NGNiLThhNTQtY2MyN2QyYjNjOGJlIiwicmlkIjoiZTBhMGJjNGUtNDc1ZS00ZGU2LWIxMTEtNmM3NzkyOTk3OTg3In0.yZUBzejLlujJpIQV2jK2pbA5ggB2466PrZkU1XfYkH6D2PH04xSip71k9DGdZyCxCgcVHKGaHmLssPbgIhF7Dg'
});

async function fix() {
  console.log('Dropping tables...');
  await db.execute('PRAGMA foreign_keys = OFF');
  
  const tables = ['BedLog', 'BedSensor', 'Booking', 'ScanLog', 'MasterCard', 'User', 'Room'];
  for (const table of tables) {
    try { await db.execute(`DROP TABLE IF EXISTS "${table}"`); } catch (e) { console.log(e.message); }
  }

  console.log('Creating tables...');

  await db.execute(`CREATE TABLE "Room" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "number" TEXT NOT NULL UNIQUE
  )`);

  await db.execute(`CREATE TABLE "Booking" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "roomNumber" TEXT NOT NULL,
      "customerName" TEXT NOT NULL,
      "customerCardUid" TEXT NOT NULL,
      "managerCardUid" TEXT NOT NULL,
      "startTime" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "endTime" DATETIME NOT NULL,
      "isActive" BOOLEAN NOT NULL DEFAULT true,
      CONSTRAINT "Booking_roomNumber_fkey" FOREIGN KEY ("roomNumber") REFERENCES "Room" ("number") ON DELETE RESTRICT ON UPDATE CASCADE
  )`);

  await db.execute(`CREATE TABLE "MasterCard" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "uid" TEXT NOT NULL UNIQUE,
      "name" TEXT NOT NULL
  )`);

  await db.execute(`CREATE TABLE "ScanLog" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "roomNumber" TEXT NOT NULL,
      "cardUid" TEXT NOT NULL,
      "cardType" TEXT NOT NULL,
      "accessGranted" BOOLEAN NOT NULL,
      "reason" TEXT,
      "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);

  await db.execute(`CREATE TABLE "User" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "name" TEXT NOT NULL,
      "email" TEXT NOT NULL UNIQUE,
      "password" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);

  await db.execute(`CREATE TABLE "BedSensor" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "roomNumber" TEXT NOT NULL UNIQUE,
      "weight" REAL NOT NULL DEFAULT 0,
      "isOccupied" BOOLEAN NOT NULL DEFAULT false,
      "lastUpdate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "BedSensor_roomNumber_fkey" FOREIGN KEY ("roomNumber") REFERENCES "Room" ("number") ON DELETE RESTRICT ON UPDATE CASCADE
  )`);

  await db.execute(`CREATE TABLE "BedLog" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "roomNumber" TEXT NOT NULL,
      "weight" REAL NOT NULL,
      "isOccupied" BOOLEAN NOT NULL,
      "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);

  await db.execute(`CREATE UNIQUE INDEX "BedSensor_roomNumber_key" ON "BedSensor"("roomNumber")`);

  console.log('Schema fixed successfully!');
  db.close();
}

fix();

import { createClient } from '@libsql/client';

const db = createClient({
  url: 'libsql://smartlock-mallukh.aws-ap-south-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzYyNDAzNzgsImlkIjoiMDE5ZDkwMmMtM2IwMS03NGNiLThhNTQtY2MyN2QyYjNjOGJlIiwicmlkIjoiZTBhMGJjNGUtNDc1ZS00ZGU2LWIxMTEtNmM3NzkyOTk3OTg3In0.yZUBzejLlujJpIQV2jK2pbA5ggB2466PrZkU1XfYkH6D2PH04xSip71k9DGdZyCxCgcVHKGaHmLssPbgIhF7Dg'
});

async function fix() {
  await db.execute('DROP TABLE IF EXISTS "BedLog"');

  await db.execute(`CREATE TABLE "BedLog" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "roomNumber" TEXT NOT NULL,
      "occupiedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "vacatedAt" DATETIME,
      "durationStr" TEXT
  )`);
  console.log('BedLog schema updated on Turso.');
  db.close();
}
fix();

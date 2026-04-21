import { createClient } from '@libsql/client';

const db = createClient({
  url: 'libsql://smartlock-mallukh.aws-ap-south-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzYyNDAzNzgsImlkIjoiMDE5ZDkwMmMtM2IwMS03NGNiLThhNTQtY2MyN2QyYjNjOGJlIiwicmlkIjoiZTBhMGJjNGUtNDc1ZS00ZGU2LWIxMTEtNmM3NzkyOTk3OTg3In0.yZUBzejLlujJpIQV2jK2pbA5ggB2466PrZkU1XfYkH6D2PH04xSip71k9DGdZyCxCgcVHKGaHmLssPbgIhF7Dg'
});

async function run() {
  const schema = await db.execute("SELECT type, name, sql FROM sqlite_master WHERE type='table' OR type='index'");
  console.log(JSON.stringify(schema.rows, null, 2));
  db.close();
}

run();

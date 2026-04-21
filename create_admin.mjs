import { createClient } from '@libsql/client';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

const db = createClient({
  url: process.env.DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const hashedPassword = await bcrypt.hash('admin123', 12);

try {
  const existing = await db.execute("SELECT * FROM User WHERE email = 'admin@smartlock.com'");
  if (existing.rows.length > 0) {
    console.log('Admin user already exists!');
  } else {
    await db.execute({
      sql: `INSERT INTO User (name, email, password, createdAt) VALUES (?, ?, ?, ?)`,
      args: ['Admin', 'admin@smartlock.com', hashedPassword, new Date().toISOString()],
    });
    console.log('✅ Admin user created!');
    console.log('   Email: admin@smartlock.com');
    console.log('   Password: admin123');
  }
} catch (e) {
  console.error('Error:', e.message);
}

db.close();

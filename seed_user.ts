import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  console.log(`Current users in DB: ${users.length}`);
  
  if (users.length === 0) {
    console.log('No users found. Creating a default admin user...');
    const hashedPassword = await bcrypt.hash('admin123', 12);
    const admin = await prisma.user.create({
      data: {
        name: 'Admin',
        email: 'admin@admin.com',
        password: hashedPassword,
      },
    });
    console.log('Default user created:');
    console.log(`Email: ${admin.email}`);
    console.log('Password: admin123');
  } else {
    users.forEach(u => console.log(`- ${u.email}`));
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

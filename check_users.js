const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const users = await prisma.user.findMany();
    console.log('--- USERS ---');
    if (users.length === 0) {
      console.log('No users found in database.');
    } else {
      users.forEach(u => console.log(`Email: ${u.email}, Name: ${u.name}`));
    }
  } catch (err) {
    console.error('Error fetching users:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();

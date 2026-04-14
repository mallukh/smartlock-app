import { prisma } from '../src/lib/prisma';
import bcrypt from 'bcryptjs';

async function main() {
  const rooms = ['101', '102', '103', '104', '105'];
  for (const number of rooms) {
    await prisma.room.upsert({
      where: { number },
      update: {},
      create: { number },
    });
  }
  
  await prisma.masterCard.upsert({
    where: { uid: 'MASTER123' },
    update: {},
    create: { uid: 'MASTER123', name: 'Default Master Card' },
  });

  const hashedPassword = await bcrypt.hash('admin123', 12);
  await prisma.user.upsert({
    where: { email: 'admin@lodge.com' },
    update: {},
    create: {
      name: 'Admin Manager',
      email: 'admin@lodge.com',
      password: hashedPassword,
    },
  });
  
  console.log('Successfully seeded rooms, master card, and default admin user.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    process.exit(0);
  });

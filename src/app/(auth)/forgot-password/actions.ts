'use server';

import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let result = '';
  for (let i = 0; i < 10; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function resetPasswordAction(email: string) {
  if (!email) {
    return { error: 'Email is required' };
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return { error: 'No account found with this email address' };
  }

  // Generate a temporary password
  const tempPassword = generateTempPassword();
  const hashedPassword = await bcrypt.hash(tempPassword, 12);

  // Update user's password
  await prisma.user.update({
    where: { email },
    data: { password: hashedPassword },
  });

  return { tempPassword };
}

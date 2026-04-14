'use server';

import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

interface SignupInput {
  name: string;
  email: string;
  password: string;
}

export async function signupAction(input: SignupInput) {
  const { name, email, password } = input;

  if (!name || !email || !password) {
    return { error: 'All fields are required' };
  }

  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters' };
  }

  // Check if email already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return { error: 'An account with this email already exists' };
  }

  // Hash password and create user
  const hashedPassword = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
    },
  });

  return { success: true };
}

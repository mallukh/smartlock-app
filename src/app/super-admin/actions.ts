'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { auth } from '@/lib/auth';

async function checkSuperAdmin() {
  const session = await auth();
  if (!session || !session.user || session.user.role !== 'SUPER_ADMIN') {
    throw new Error('Unauthorized');
  }
}

export async function createLodge(formData: FormData) {
  await checkSuperAdmin();

  const name = (formData.get('name') as string).trim();
  const code = (formData.get('code') as string).trim().toLowerCase().replace(/[^a-z0-9-]/g, '');

  if (!name || !code) {
    throw new Error('Name and code are required');
  }

  // Generate a random secure API key
  const apiKey = 'lodge_live_' + crypto.randomBytes(16).toString('hex');

  await prisma.lodge.create({
    data: {
      name,
      code,
      apiKey
    }
  });

  revalidatePath('/super-admin');
}

export async function createLodgeUser(formData: FormData) {
  await checkSuperAdmin();

  const name = (formData.get('name') as string).trim();
  const email = (formData.get('email') as string).trim().toLowerCase();
  const password = (formData.get('password') as string);
  const lodgeId = parseInt(formData.get('lodgeId') as string, 10);

  if (!name || !email || !password || isNaN(lodgeId)) {
    throw new Error('All fields are required');
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: 'LODGE_ADMIN',
      lodgeId
    }
  });

  revalidatePath('/super-admin');
}

export async function deleteLodge(formData: FormData) {
  await checkSuperAdmin();

  const id = parseInt(formData.get('id') as string, 10);
  if (isNaN(id)) throw new Error('Invalid ID');

  // Deleting the lodge will cascade to users, rooms, sensors, and logs automatically due to schema definitions
  await prisma.lodge.delete({ where: { id } });

  revalidatePath('/super-admin');
}

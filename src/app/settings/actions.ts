'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function addMasterCard(formData: FormData) {
  const uid = (formData.get('cardUid') as string).toUpperCase().trim();
  const name = (formData.get('cardName') as string).trim();
  if (!uid || !name) throw new Error('Missing fields');

  await prisma.masterCard.upsert({
    where: { uid },
    update: { name },
    create: { uid, name },
  });
  revalidatePath('/settings');
}

export async function removeMasterCard(formData: FormData) {
  const id = parseInt(formData.get('id') as string, 10);
  await prisma.masterCard.delete({ where: { id } });
  revalidatePath('/settings');
}

export async function addRoom(formData: FormData) {
  const number = (formData.get('roomNumber') as string).trim();
  if (!number) throw new Error('Room number required');

  await prisma.room.upsert({
    where: { number },
    update: {},
    create: { number },
  });
  revalidatePath('/settings');
  revalidatePath('/');
}

export async function deleteRoom(formData: FormData) {
  const id = parseInt(formData.get('id') as string, 10);
  // First deactivate all bookings for this room
  const room = await prisma.room.findUnique({ where: { id } });
  if (room) {
    await prisma.booking.updateMany({
      where: { roomNumber: room.number },
      data: { isActive: false },
    });
    await prisma.room.delete({ where: { id } });
  }
  revalidatePath('/settings');
  revalidatePath('/');
}

export async function resetBedSensor(formData: FormData) {
  const id = parseInt(formData.get('id') as string, 10);
  await prisma.bedSensor.delete({ where: { id } });
  revalidatePath('/settings');
  revalidatePath('/');
  revalidatePath('/bed-monitor');
}

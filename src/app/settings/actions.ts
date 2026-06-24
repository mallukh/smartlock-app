'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';

async function getLodgeId() {
  const session = await auth();
  if (!session || !session.user || !session.user.lodgeId) {
    throw new Error('Unauthorized');
  }
  return session.user.lodgeId;
}

export async function addMasterCard(formData: FormData) {
  const lodgeId = await getLodgeId();
  const uid = (formData.get('cardUid') as string).toUpperCase().trim();
  const name = (formData.get('cardName') as string).trim();
  if (!uid || !name) throw new Error('Missing fields');

  await prisma.masterCard.upsert({
    where: {
      uid_lodgeId: {
        uid,
        lodgeId
      }
    },
    update: { name },
    create: { uid, name, lodgeId },
  });
  revalidatePath('/settings');
}

export async function removeMasterCard(formData: FormData) {
  const lodgeId = await getLodgeId();
  const id = parseInt(formData.get('id') as string, 10);

  const card = await prisma.masterCard.findUnique({ where: { id } });
  if (!card || card.lodgeId !== lodgeId) throw new Error('Unauthorized');

  await prisma.masterCard.delete({ where: { id } });
  revalidatePath('/settings');
}

export async function addRoom(formData: FormData) {
  const lodgeId = await getLodgeId();
  const number = (formData.get('roomNumber') as string).trim();
  if (!number) throw new Error('Room number required');

  await prisma.room.upsert({
    where: {
      number_lodgeId: {
        number,
        lodgeId
      }
    },
    update: {},
    create: { number, lodgeId },
  });
  
  revalidatePath('/settings');
  revalidatePath('/dashboard');
}

export async function deleteRoom(formData: FormData) {
  const lodgeId = await getLodgeId();
  const id = parseInt(formData.get('id') as string, 10);

  const room = await prisma.room.findUnique({ where: { id } });
  if (!room || room.lodgeId !== lodgeId) throw new Error('Unauthorized');

  // Cascade delete handles cleanup of bookings, bedSensors, roomSensors
  await prisma.room.delete({ where: { id } });

  revalidatePath('/settings');
  revalidatePath('/dashboard');
}

export async function resetBedSensor(formData: FormData) {
  const lodgeId = await getLodgeId();
  const id = parseInt(formData.get('id') as string, 10);

  const sensor = await prisma.bedSensor.findUnique({
    where: { id },
    include: { room: true }
  });
  if (!sensor || sensor.room.lodgeId !== lodgeId) throw new Error('Unauthorized');

  await prisma.bedSensor.delete({ where: { id } });
  
  revalidatePath('/settings');
  revalidatePath('/dashboard');
  revalidatePath('/bed-monitor');
}

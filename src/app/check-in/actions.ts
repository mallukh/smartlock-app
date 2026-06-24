'use server';

import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';

export async function checkIn(formData: FormData) {
  const session = await auth();
  if (!session || !session.user || !session.user.lodgeId) {
    throw new Error('Unauthorized');
  }
  const lodgeId = session.user.lodgeId;

  const roomNumber = formData.get('roomNumber') as string;
  const customerName = formData.get('customerName') as string;
  const durationHours = parseInt(formData.get('durationHours') as string, 10);
  const customerCardUid = (formData.get('customerCardUid') as string).toUpperCase();
  const managerCardUid = (formData.get('managerCardUid') as string).toUpperCase();

  if (!roomNumber || !customerName || !durationHours || !customerCardUid || !managerCardUid) {
    throw new Error('Missing fields');
  }

  const now = new Date();
  const endTime = new Date(now.getTime() + durationHours * 60 * 60 * 1000);

  // 1. Find the Room in this Lodge
  const room = await prisma.room.findUnique({
    where: {
      number_lodgeId: {
        number: roomNumber,
        lodgeId
      }
    }
  });

  if (!room) {
    throw new Error('Room not found');
  }

  // 2. Mark any existing active bookings for this room as inactive
  await prisma.booking.updateMany({
    where: {
      roomId: room.id,
      isActive: true,
    },
    data: {
      isActive: false,
    },
  });

  // 3. Create new booking
  await prisma.booking.create({
    data: {
      roomId: room.id,
      customerName,
      customerCardUid,
      managerCardUid,
      startTime: now,
      endTime,
      isActive: true,
    },
  });

  redirect('/dashboard');
}

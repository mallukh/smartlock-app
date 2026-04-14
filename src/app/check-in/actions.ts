'use server';

import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';

export async function checkIn(formData: FormData) {
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

  // Mark any existing active bookings for this room as inactive
  await prisma.booking.updateMany({
    where: {
      roomNumber,
      isActive: true,
    },
    data: {
      isActive: false,
    },
  });

  // Create new booking
  await prisma.booking.create({
    data: {
      roomNumber,
      customerName,
      customerCardUid,
      managerCardUid,
      startTime: now,
      endTime,
      isActive: true,
    },
  });

  redirect('/');
}

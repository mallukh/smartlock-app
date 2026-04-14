import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { roomNumber, cardUid } = body;

    if (!roomNumber || !cardUid) {
      return NextResponse.json({ authorized: false, reason: 'missing parameters' }, { status: 400 });
    }

    const uid = cardUid.toUpperCase();

    // Helper to log the scan and return a response
    const logAndRespond = async (
      cardType: string,
      accessGranted: boolean,
      reason?: string
    ) => {
      await prisma.scanLog.create({
        data: {
          roomNumber,
          cardUid: uid,
          cardType,
          accessGranted,
          reason: reason ?? null,
        },
      });
      if (accessGranted) {
        return NextResponse.json({ authorized: true });
      }
      return NextResponse.json({ authorized: false, reason: reason ?? 'denied' });
    };

    // 1. Check Master Card
    const masterCard = await prisma.masterCard.findUnique({ where: { uid } });
    if (masterCard) {
      return await logAndRespond('MASTER', true);
    }

    // 2. Find active booking for this room
    const activeBooking = await prisma.booking.findFirst({
      where: { roomNumber, isActive: true },
      orderBy: { startTime: 'desc' },
    });

    if (!activeBooking) {
      return await logAndRespond('UNKNOWN', false, 'no active booking');
    }

    // 3. Identify card type
    const isCustomerCard = uid === activeBooking.customerCardUid.toUpperCase();
    const isManagerCard  = uid === activeBooking.managerCardUid.toUpperCase();

    if (!isCustomerCard && !isManagerCard) {
      return await logAndRespond('UNKNOWN', false, 'invalid card for this room');
    }

    const cardType = isManagerCard ? 'MANAGER' : 'CUSTOMER';

    // 4. Check expiration
    const now = new Date();
    if (now > activeBooking.endTime) {
      await prisma.booking.update({ where: { id: activeBooking.id }, data: { isActive: false } });
      return await logAndRespond(cardType, false, 'expired');
    }

    return await logAndRespond(cardType, true);

  } catch (error) {
    console.error('Verify API error:', error);
    return NextResponse.json({ authorized: false, reason: 'server error' }, { status: 500 });
  }
}

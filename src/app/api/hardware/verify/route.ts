import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { roomNumber, cardUid, apiKey } = body;

    // Check for API Key in headers or body
    const key = req.headers.get('x-api-key') || apiKey;
    if (!key) {
      return NextResponse.json({ authorized: false, reason: 'missing API key' }, { status: 401 });
    }

    if (!roomNumber || !cardUid) {
      return NextResponse.json({ authorized: false, reason: 'missing parameters' }, { status: 400 });
    }

    // 1. Authenticate Lodge
    const lodge = await prisma.lodge.findFirst({
      where: {
        OR: [
          { apiKey: String(key) },
          { code: String(key) } // Fallback to code
        ]
      }
    });

    if (!lodge) {
      return NextResponse.json({ authorized: false, reason: 'invalid API key' }, { status: 401 });
    }

    // 2. Find Room in this Lodge
    const room = await prisma.room.findUnique({
      where: {
        number_lodgeId: {
          number: String(roomNumber),
          lodgeId: lodge.id,
        }
      }
    });

    if (!room) {
      return NextResponse.json({ authorized: false, reason: 'room does not exist' }, { status: 404 });
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
          roomNumber: String(roomNumber),
          cardUid: uid,
          cardType,
          accessGranted,
          reason: reason ?? null,
          lodgeId: lodge.id,
        },
      });
      if (accessGranted) {
        return NextResponse.json({ authorized: true });
      }
      return NextResponse.json({ authorized: false, reason: reason ?? 'denied' });
    };

    // 3. Check Master Card for this Lodge
    const masterCard = await prisma.masterCard.findUnique({
      where: {
        uid_lodgeId: {
          uid,
          lodgeId: lodge.id,
        }
      }
    });
    if (masterCard) {
      return await logAndRespond('MASTER', true);
    }

    // 4. Find active booking for this specific Room
    const activeBooking = await prisma.booking.findFirst({
      where: { roomId: room.id, isActive: true },
      orderBy: { startTime: 'desc' },
    });

    if (!activeBooking) {
      return await logAndRespond('UNKNOWN', false, 'no active booking');
    }

    // 5. Identify card type
    const isCustomerCard = uid === activeBooking.customerCardUid.toUpperCase();
    const isManagerCard  = uid === activeBooking.managerCardUid.toUpperCase();

    if (!isCustomerCard && !isManagerCard) {
      return await logAndRespond('UNKNOWN', false, 'invalid card for this room');
    }

    const cardType = isManagerCard ? 'MANAGER' : 'CUSTOMER';

    // 6. Check expiration
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

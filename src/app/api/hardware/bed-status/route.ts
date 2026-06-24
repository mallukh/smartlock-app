import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const OCCUPANCY_THRESHOLD_KG = 5.0;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { roomNumber, weight, apiKey } = body;

    // 1. Authenticate Lodge via API Key
    const key = req.headers.get('x-api-key') || apiKey;
    if (!key) {
      return NextResponse.json({ success: false, error: 'missing API key' }, { status: 401 });
    }

    const lodge = await prisma.lodge.findFirst({
      where: {
        OR: [
          { apiKey: String(key) },
          { code: String(key) }
        ]
      }
    });

    if (!lodge) {
      return NextResponse.json({ success: false, error: 'invalid API key' }, { status: 401 });
    }

    if (!roomNumber || weight === undefined || weight === null) {
      return NextResponse.json(
        { success: false, error: 'missing roomNumber or weight' },
        { status: 400 }
      );
    }

    const weightKg = parseFloat(weight);
    if (isNaN(weightKg)) {
      return NextResponse.json(
        { success: false, error: 'weight must be a number' },
        { status: 400 }
      );
    }

    const isOccupied = weightKg >= OCCUPANCY_THRESHOLD_KG;

    // 2. Ensure room exists for this lodge
    const room = await prisma.room.upsert({
      where: {
        number_lodgeId: {
          number: String(roomNumber),
          lodgeId: lodge.id
        }
      },
      update: {},
      create: {
        number: String(roomNumber),
        lodgeId: lodge.id
      },
    });

    // 3. Fetch previous state 
    const prevSensor = await prisma.bedSensor.findUnique({
      where: { roomId: room.id },
    });
    const wasOccupied = prevSensor?.isOccupied || false;

    // 4. Detect state change
    if (!wasOccupied && isOccupied) {
      // Just became occupied — start a new log session
      await prisma.bedLog.create({
        data: {
          roomId: room.id,
          occupiedAt: new Date(),
        },
      });
    } else if (wasOccupied && !isOccupied) {
      // Just vacated — close the open log session
      const openLog = await prisma.bedLog.findFirst({
        where: { roomId: room.id, vacatedAt: null },
        orderBy: { occupiedAt: 'desc' },
      });

      if (openLog) {
        const vacatedAt = new Date();
        const durationMs = vacatedAt.getTime() - openLog.occupiedAt.getTime();
        const mins = Math.floor(durationMs / 60000);
        const hrs = Math.floor(mins / 60);
        const remMins = mins % 60;
        const durationStr = `${hrs}h ${remMins}m`;

        await prisma.bedLog.update({
          where: { id: openLog.id },
          data: { vacatedAt, durationStr },
        });
      }
    }

    // 5. Upsert live sensor state
    await prisma.bedSensor.upsert({
      where: { roomId: room.id },
      update: {
        weight: weightKg,
        isOccupied,
        lastUpdate: new Date(),
      },
      create: {
        roomId: room.id,
        weight: weightKg,
        isOccupied,
        lastUpdate: new Date(),
      },
    });

    // Auto-purge logs older than 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    await prisma.bedLog.deleteMany({
      where: {
        roomId: room.id,
        occupiedAt: { lt: sevenDaysAgo }
      },
    });

    return NextResponse.json({ success: true, isOccupied, weight: weightKg });
  } catch (error) {
    console.error('Bed status API error:', error);
    return NextResponse.json(
      { success: false, error: 'server error' },
      { status: 500 }
    );
  }
}

// GET: Fetch live bed sensor data for a specific Lodge
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const key = req.headers.get('x-api-key') || url.searchParams.get('apiKey');

    if (!key) {
      return NextResponse.json({ success: false, error: 'missing API key' }, { status: 401 });
    }

    const lodge = await prisma.lodge.findFirst({
      where: {
        OR: [
          { apiKey: String(key) },
          { code: String(key) }
        ]
      }
    });

    if (!lodge) {
      return NextResponse.json({ success: false, error: 'invalid API key' }, { status: 401 });
    }

    const sensors = await prisma.bedSensor.findMany({
      where: {
        room: {
          lodgeId: lodge.id
        }
      },
      orderBy: {
        room: {
          number: 'asc'
        }
      },
    });
    return NextResponse.json({ sensors });
  } catch (error) {
    console.error('Bed status GET error:', error);
    return NextResponse.json({ sensors: [] }, { status: 500 });
  }
}

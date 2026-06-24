import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      roomNumber,
      isOccupied,
      pirTriggered,
      radarPresence,
      movingDistance,
      stationaryDistance,
      apiKey
    } = body;

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

    if (!roomNumber) {
      return NextResponse.json(
        { success: false, error: 'missing roomNumber' },
        { status: 400 }
      );
    }

    const occupied = !!isOccupied;
    const pir = !!pirTriggered;
    const radar = !!radarPresence;
    const movingDist = (parseFloat(movingDistance) || 0) / 100.0; // convert cm to meters
    const stationaryDist = (parseFloat(stationaryDistance) || 0) / 100.0; // convert cm to meters

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

    // 3. Fetch previous room sensor state
    const prevSensor = await prisma.roomSensor.findUnique({
      where: { roomId: room.id },
    });
    const wasOccupied = prevSensor?.isOccupied || false;

    // 4. Detect state changes for occupancy logging
    if (!wasOccupied && occupied) {
      // Transition from Vacant -> Occupied: start session
      await prisma.roomOccupancyLog.create({
        data: {
          roomId: room.id,
          occupiedAt: new Date(),
        },
      });
    } else if (wasOccupied && !occupied) {
      // Transition from Occupied -> Vacant: close session
      const openLog = await prisma.roomOccupancyLog.findFirst({
        where: { roomId: room.id, vacatedAt: null },
        orderBy: { occupiedAt: 'desc' },
      });

      if (openLog) {
        const vacatedAt = new Date();
        const durationMs = vacatedAt.getTime() - openLog.occupiedAt.getTime();

        if (durationMs < 5 * 60 * 1000) {
          // If occupancy is less than 5 minutes, discard the log entry
          await prisma.roomOccupancyLog.delete({
            where: { id: openLog.id },
          });
        } else {
          const mins = Math.floor(durationMs / 60000);
          const hrs = Math.floor(mins / 60);
          const remMins = mins % 60;
          const durationStr = `${hrs}h ${remMins}m`;

          await prisma.roomOccupancyLog.update({
            where: { id: openLog.id },
            data: { vacatedAt, durationStr },
          });
        }
      }
    }

    // 5. Upsert live room sensor state
    const updatedSensor = await prisma.roomSensor.upsert({
      where: { roomId: room.id },
      update: {
        isOccupied: occupied,
        pirTriggered: pir,
        radarPresence: radar,
        movingDistance: movingDist,
        stationaryDistance: stationaryDist,
        lastUpdate: new Date(),
      },
      create: {
        roomId: room.id,
        isOccupied: occupied,
        pirTriggered: pir,
        radarPresence: radar,
        movingDistance: movingDist,
        stationaryDistance: stationaryDist,
        lastUpdate: new Date(),
      },
    });

    // Auto-purge logs older than 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    await prisma.roomOccupancyLog.deleteMany({
      where: {
        roomId: room.id,
        occupiedAt: { lt: sevenDaysAgo }
      },
    });

    return NextResponse.json({
      success: true,
      isOccupied: updatedSensor.isOccupied,
      pirTriggered: updatedSensor.pirTriggered,
      radarPresence: updatedSensor.radarPresence,
    });
  } catch (error) {
    console.error('Room status API error:', error);
    return NextResponse.json(
      { success: false, error: 'server error' },
      { status: 500 }
    );
  }
}

// GET: Fetch live room sensor data for a specific Lodge
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

    const sensors = await prisma.roomSensor.findMany({
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
    console.error('Room status GET error:', error);
    return NextResponse.json({ sensors: [] }, { status: 500 });
  }
}

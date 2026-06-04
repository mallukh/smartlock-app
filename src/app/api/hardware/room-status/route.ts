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
    } = body;

    if (!roomNumber) {
      return NextResponse.json(
        { success: false, error: 'missing roomNumber' },
        { status: 400 }
      );
    }

    const occupied = !!isOccupied;
    const pir = !!pirTriggered;
    const radar = !!radarPresence;
    const movingDist = parseFloat(movingDistance) || 0;
    const stationaryDist = parseFloat(stationaryDistance) || 0;

    // Ensure the room exists first to prevent foreign key errors
    await prisma.room.upsert({
      where: { number: String(roomNumber) },
      update: {},
      create: { number: String(roomNumber) },
    });

    // Fetch previous room sensor state
    const prevSensor = await prisma.roomSensor.findUnique({
      where: { roomNumber: String(roomNumber) },
    });
    const wasOccupied = prevSensor?.isOccupied || false;

    // Detect state changes for occupancy logging
    if (!wasOccupied && occupied) {
      // Transition from Vacant -> Occupied: start session
      await prisma.roomOccupancyLog.create({
        data: {
          roomNumber: String(roomNumber),
          occupiedAt: new Date(),
        },
      });
    } else if (wasOccupied && !occupied) {
      // Transition from Occupied -> Vacant: close session
      const openLog = await prisma.roomOccupancyLog.findFirst({
        where: { roomNumber: String(roomNumber), vacatedAt: null },
        orderBy: { occupiedAt: 'desc' },
      });

      if (openLog) {
        const vacatedAt = new Date();
        const durationMs = vacatedAt.getTime() - openLog.occupiedAt.getTime();
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

    // Upsert live room sensor state
    const updatedSensor = await prisma.roomSensor.upsert({
      where: { roomNumber: String(roomNumber) },
      update: {
        isOccupied: occupied,
        pirTriggered: pir,
        radarPresence: radar,
        movingDistance: movingDist,
        stationaryDistance: stationaryDist,
        lastUpdate: new Date(),
      },
      create: {
        roomNumber: String(roomNumber),
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
      where: { occupiedAt: { lt: sevenDaysAgo } },
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

// GET: Fetch live room sensor data for all rooms
export async function GET() {
  try {
    const sensors = await prisma.roomSensor.findMany({
      orderBy: { roomNumber: 'asc' },
    });
    return NextResponse.json({ sensors });
  } catch (error) {
    console.error('Room status GET error:', error);
    return NextResponse.json({ sensors: [] }, { status: 500 });
  }
}

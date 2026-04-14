import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const OCCUPANCY_THRESHOLD_KG = 5.0;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { roomNumber, weight } = body;

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

    // Upsert live sensor state
    await prisma.bedSensor.upsert({
      where: { roomNumber: String(roomNumber) },
      update: {
        weight: weightKg,
        isOccupied,
        lastUpdate: new Date(),
      },
      create: {
        roomNumber: String(roomNumber),
        weight: weightKg,
        isOccupied,
        lastUpdate: new Date(),
      },
    });

    // Log entry for history
    await prisma.bedLog.create({
      data: {
        roomNumber: String(roomNumber),
        weight: weightKg,
        isOccupied,
      },
    });

    // Auto-purge logs older than 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    await prisma.bedLog.deleteMany({
      where: { timestamp: { lt: sevenDaysAgo } },
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

// GET: Fetch live bed sensor data for all rooms (used by dashboard polling)
export async function GET() {
  try {
    const sensors = await prisma.bedSensor.findMany({
      orderBy: { roomNumber: 'asc' },
    });
    return NextResponse.json({ sensors });
  } catch (error) {
    console.error('Bed status GET error:', error);
    return NextResponse.json({ sensors: [] }, { status: 500 });
  }
}

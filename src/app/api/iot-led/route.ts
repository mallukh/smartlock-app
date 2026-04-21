import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// We store LED state in the MasterCard table as a special entry with uid="IOT_LED"
// This is a simple hack to avoid schema changes — works with existing DB.

const LED_UID = 'IOT_LED_STATE';

async function getLedState(): Promise<string> {
  try {
    const record = await prisma.masterCard.findUnique({
      where: { uid: LED_UID },
    });
    return record?.name === 'ON' ? 'ON' : 'OFF';
  } catch {
    return 'OFF';
  }
}

async function setLedState(state: string): Promise<void> {
  await prisma.masterCard.upsert({
    where: { uid: LED_UID },
    update: { name: state },
    create: { uid: LED_UID, name: state },
  });
}

export async function GET() {
  const state = await getLedState();
  // Return pure plain text so the ESP32 can read it easily
  return new NextResponse(state, {
    status: 200,
    headers: { 'Content-Type': 'text/plain' },
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'ON' || action === 'OFF') {
      await setLedState(action);
      return NextResponse.json({ success: true, state: action });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('IoT LED API error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// We'll use a simple text file to store the LED state so it persists across API calls
const STATE_FILE = path.join(process.cwd(), 'iot_led_state.txt');

export async function GET() {
  try {
    let state = 'OFF';
    if (fs.existsSync(STATE_FILE)) {
      state = fs.readFileSync(STATE_FILE, 'utf-8').trim();
    }
    // Return pure plain text so the ESP32 can read it easily
    return new NextResponse(state, { 
      status: 200, 
      headers: { 'Content-Type': 'text/plain' } 
    });
  } catch (error) {
    return new NextResponse('ERROR', { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action } = body;
    
    if (action === 'ON' || action === 'OFF') {
      fs.writeFileSync(STATE_FILE, action);
      return NextResponse.json({ success: true, state: action });
    }
    
    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

import { checkIn } from './actions';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function CheckInPage({ searchParams }: { searchParams: Promise<{ room?: string }> }) {
  const resolvedParams = await searchParams;
  const rooms = await prisma.room.findMany();
  
  return (
    <>
      <h1 className="page-title">Check In</h1>
      <p className="page-subtitle">Assign a room key dynamically</p>
      
      <div className="glass-card" style={{ maxWidth: '600px' }}>
        <form action={checkIn}>
          <div className="form-group">
            <label className="form-label">Room Number</label>
            <select 
              name="roomNumber" 
              className="input-field" 
              defaultValue={resolvedParams.room || ''}
              required
            >
              <option value="" disabled>Select a room</option>
              {rooms.map(r => (
                <option key={r.id} value={r.number}>{r.number}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Customer Name</label>
            <input type="text" name="customerName" className="input-field" required placeholder="John Doe" />
          </div>

          <div className="form-group">
            <label className="form-label">Time Duration (Hours)</label>
            <input type="number" name="durationHours" className="input-field" required min="1" defaultValue="24" />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Customer RFID Card UID</label>
              <input type="text" name="customerCardUid" className="input-field" required placeholder="e.g. 1A2B3C" />
            </div>
            
            <div className="form-group">
              <label className="form-label">Manager/Worker RFID Card UID</label>
              <input type="text" name="managerCardUid" className="input-field" required placeholder="e.g. 9F8E7D" />
            </div>
          </div>

          <button type="submit" className="btn" style={{ width: '100%', marginTop: '16px' }}>
            Confirm Check-In
          </button>
        </form>
      </div>
    </>
  );
}

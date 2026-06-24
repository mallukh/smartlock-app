import { addMasterCard, removeMasterCard, addRoom, deleteRoom, resetBedSensor } from './actions';
import { prisma } from '@/lib/prisma';
import { formatLocalDateTime } from '@/lib/date';
import type { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'System Settings & Devices - Smart Lodge',
  description: 'Manage smart lodge rooms, master RFID access keycards, active bed weight sensors, and device calibrations.',
};

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const session = await auth();
  if (!session || !session.user) {
    redirect('/login');
  }

  const lodgeId = session.user.lodgeId;
  if (lodgeId === null || lodgeId === undefined) {
    return (
      <div className="public-container">
        <h1 className="page-title">Access Denied</h1>
        <p className="public-p">Your account is not associated with any Lodge. Please contact system support.</p>
      </div>
    );
  }

  // Fetch Lodge, MasterCards, Rooms, and BedSensors
  const [lodge, masterCards, rooms, bedSensors] = await Promise.all([
    prisma.lodge.findUnique({ where: { id: lodgeId } }),
    prisma.masterCard.findMany({ where: { lodgeId } }),
    prisma.room.findMany({
      where: { lodgeId },
      orderBy: { number: 'asc' }
    }),
    prisma.bedSensor.findMany({
      where: { room: { lodgeId } },
      include: { room: true },
      orderBy: { room: { number: 'asc' } }
    }),
  ]);

  const now = new Date();

  return (
    <>
      <h1 className="page-title">Settings</h1>
      <p className="page-subtitle">Manage rooms, master keys, bed sensors, and access control for {lodge?.name}</p>

      {/* ── Hardware Integration Credentials ── */}
      <h2 style={{ fontSize: '1.2rem', color: 'var(--text-muted)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Hardware Integration</h2>
      <div className="glass-card" style={{ marginBottom: '40px' }}>
        <h3 style={{ fontSize: '1.15rem', marginTop: 0 }}>Device Credentials</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '20px' }}>
          Configure your ESP32 client microcontrollers with the following properties in their request headers (<code style={{ color: '#818cf8' }}>x-api-key</code>) or payloads:
        </p>
        <div className="grid-2">
          <div style={{ padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px solid var(--card-border)' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Lodge Code</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', fontFamily: 'monospace' }}>{lodge?.code}</div>
          </div>
          <div style={{ padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px solid var(--card-border)' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Lodge API Key</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', fontFamily: 'monospace', color: '#a5b4fc' }}>{lodge?.apiKey}</div>
          </div>
        </div>
      </div>

      {/* ── Room Management ── */}
      <h2 style={{ fontSize: '1.2rem', color: 'var(--text-muted)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Room Management</h2>
      <div className="grid-2" style={{ marginBottom: '40px' }}>
        <div className="glass-card">
          <h3 style={{ fontSize: '1.15rem', marginTop: 0 }}>Add New Room</h3>
          <form action={addRoom} style={{ marginTop: '16px' }}>
            <div className="form-group">
              <label className="form-label">Room Number / Name</label>
              <input type="text" name="roomNumber" className="input-field" required placeholder="e.g. 201, Suite A" />
            </div>
            <button type="submit" className="btn" style={{ width: '100%' }}>Add Room</button>
          </form>
        </div>

        <div className="glass-card">
          <h3 style={{ fontSize: '1.15rem', marginTop: 0 }}>Existing Rooms</h3>
          <div style={{ marginTop: '16px', maxHeight: '260px', overflowY: 'auto' }}>
            {rooms.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No rooms added yet.</p>
            ) : (
              rooms.map(room => (
                <div key={room.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '12px' }}>
                  <span style={{ fontWeight: '600', fontSize: '1rem' }}>Room {room.number}</span>
                  <form action={deleteRoom}>
                    <input type="hidden" name="id" value={room.id} />
                    <button type="submit" className="btn" style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444', padding: '6px 14px', fontSize: '0.85rem' }}>Remove</button>
                  </form>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── Master Card Management ── */}
      <h2 style={{ fontSize: '1.2rem', color: 'var(--text-muted)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Master Key Cards</h2>
      <div className="grid-2" style={{ marginBottom: '40px' }}>
        <div className="glass-card">
          <h3 style={{ fontSize: '1.15rem', marginTop: 0 }}>Add New Master Card</h3>
          <form action={addMasterCard} style={{ marginTop: '16px' }}>
            <div className="form-group">
              <label className="form-label">Key Name / Label</label>
              <input type="text" name="cardName" className="input-field" required placeholder="Manager Main Key" />
            </div>
            <div className="form-group">
              <label className="form-label">RFID Card UID</label>
              <input type="text" name="cardUid" className="input-field" required placeholder="E1F2A3B4" />
            </div>
            <button type="submit" className="btn" style={{ width: '100%' }}>Add Master Key</button>
          </form>
        </div>

        <div className="glass-card">
          <h3 style={{ fontSize: '1.15rem', marginTop: 0 }}>Active Master Cards</h3>
          <div style={{ marginTop: '16px', maxHeight: '260px', overflowY: 'auto' }}>
            {masterCards.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No master cards enrolled.</p>
            ) : (
              masterCards.map(mc => (
                <div key={mc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '16px' }}>
                  <div>
                    <div style={{ fontWeight: '600' }}>{mc.name}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>UID: {mc.uid}</div>
                  </div>
                  <form action={removeMasterCard}>
                    <input type="hidden" name="id" value={mc.id} />
                    <button type="submit" className="btn" style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444', padding: '8px 16px', fontSize: '0.85rem' }}>Revoke</button>
                  </form>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── Bed Sensor Management ── */}
      <h2 style={{ fontSize: '1.2rem', color: 'var(--text-muted)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Bed Sensors</h2>
      <div className="glass-card" style={{ marginBottom: '40px' }}>
        <h3 style={{ fontSize: '1.15rem', marginTop: 0 }}>Active Bed Sensors</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '16px' }}>
          Sensors register automatically when an ESP32 bed sensor first reports data for a room. Threshold: ≥5 kg = Occupied.
        </p>
        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {bedSensors.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No bed sensors have reported yet. Connect an ESP32 with HX711 load cell to get started.</p>
          ) : (
            bedSensors.map(sensor => {
              const isStale = (now.getTime() - new Date(sensor.lastUpdate).getTime()) > 30000;
              return (
                <div key={sensor.id} className="bed-sensor-row">
                  <div className="bed-sensor-info">
                    <span className="bed-sensor-room">
                      Room {sensor.room.number}
                      {sensor.isOccupied ? (
                        <span style={{ color: '#f59e0b', fontSize: '0.85rem', marginLeft: '8px' }}>● Occupied</span>
                      ) : (
                        <span style={{ color: '#10b981', fontSize: '0.85rem', marginLeft: '8px' }}>○ Empty</span>
                      )}
                      {isStale && (
                        <span style={{ color: '#ef4444', fontSize: '0.85rem', marginLeft: '8px' }}>⚠ Offline</span>
                      )}
                    </span>
                    <span className="bed-sensor-detail">
                      Weight: {sensor.weight.toFixed(1)} kg · Last update: {formatLocalDateTime(sensor.lastUpdate)}
                    </span>
                  </div>
                  <form action={resetBedSensor}>
                    <input type="hidden" name="id" value={sensor.id} />
                    <button type="submit" className="btn" style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444', padding: '6px 14px', fontSize: '0.85rem' }}>Reset</button>
                  </form>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}

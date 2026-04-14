import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { AutoRefresh } from '@/components/AutoRefresh';

export const dynamic = 'force-dynamic';

export default async function Dashboard() {
  const [rooms, bedSensors] = await Promise.all([
    prisma.room.findMany({
      include: {
        bookings: {
          where: { isActive: true },
          orderBy: { startTime: 'desc' },
          take: 1,
        },
      },
      orderBy: { number: 'asc' },
    }),
    prisma.bedSensor.findMany(),
  ]);

  // Build lookup map for bed sensors by room number
  const bedSensorMap = new Map(
    bedSensors.map((s) => [s.roomNumber, s])
  );

  const now = new Date();

  // Stats for bed occupancy
  const totalBeds = bedSensors.length;
  const occupiedBeds = bedSensors.filter((s) => s.isOccupied).length;

  return (
    <div>
      <AutoRefresh intervalMs={5000} />
      <h1 className="page-title">Lodge Dashboard</h1>
      <p className="page-subtitle">Real-time status of all smart lock rooms &amp; bed occupancy</p>

      {/* Quick Stats */}
      <div className="dash-stats-row">
        <div className="dash-stat-card">
          <div className="dash-stat-value" style={{ color: '#6366f1' }}>{rooms.length}</div>
          <div className="dash-stat-label">Total Rooms</div>
        </div>
        <div className="dash-stat-card">
          <div className="dash-stat-value" style={{ color: '#10b981' }}>{rooms.filter(r => r.bookings.length > 0 && now <= r.bookings[0].endTime).length}</div>
          <div className="dash-stat-label">Booked</div>
        </div>
        <div className="dash-stat-card">
          <div className="dash-stat-value" style={{ color: '#f59e0b' }}>{occupiedBeds}</div>
          <div className="dash-stat-label">Beds Occupied</div>
        </div>
        <div className="dash-stat-card">
          <div className="dash-stat-value" style={{ color: '#94a3b8' }}>{totalBeds - occupiedBeds}</div>
          <div className="dash-stat-label">Beds Empty</div>
        </div>
      </div>

      <div className="rooms-grid">
        {rooms.map((room) => {
          const booking = room.bookings[0];
          const bedSensor = bedSensorMap.get(room.number);
          
          // Compute lock status
          let isOccupied = false;
          let isExpired = false;
          let statusText = 'Available';

          if (booking) {
            if (now > booking.endTime) {
              isExpired = true;
              statusText = 'Expired';
            } else {
              isOccupied = true;
              statusText = 'Occupied';
            }
          }

          // Bed sensor freshness check (stale if > 30 seconds old)
          const isSensorStale = bedSensor
            ? (now.getTime() - new Date(bedSensor.lastUpdate).getTime()) > 30000
            : false;

          return (
            <div key={room.id} className="glass-card">
              <div className="room-card-header">
                <h2 className="room-number">Room {room.number}</h2>
                <span 
                  className={`status-badge ${isOccupied ? 'status-occupied' : 'status-available'}`}
                  style={isExpired ? { background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' } : {}}
                >
                  {statusText}
                </span>
              </div>

              {/* Bed Occupancy Section */}
              <div className="bed-status-section">
                {bedSensor ? (
                  <div className={`bed-status-badge ${bedSensor.isOccupied ? 'bed-occupied' : 'bed-empty'} ${isSensorStale ? 'bed-stale' : ''}`}>
                    <span className="bed-icon">{bedSensor.isOccupied ? '🛏️' : '🛏️'}</span>
                    <div className="bed-status-info">
                      <span className="bed-status-text">
                        {bedSensor.isOccupied ? 'Bed Occupied' : 'Bed Empty'}
                      </span>
                      <span className="bed-weight-text">
                        {bedSensor.weight.toFixed(1)} kg
                        {isSensorStale && ' • Offline'}
                      </span>
                    </div>
                    {!isSensorStale && bedSensor.isOccupied && (
                      <span className="bed-live-dot" />
                    )}
                  </div>
                ) : (
                  <div className="bed-status-badge bed-no-sensor">
                    <span className="bed-icon">📡</span>
                    <span className="bed-status-text" style={{ color: 'var(--text-muted)' }}>No Bed Sensor</span>
                  </div>
                )}
              </div>
              
              {isOccupied && booking && (
                <div className="booking-info">
                  <div className="info-row">
                    <span className="info-label">Customer</span>
                    <span className="info-value">{booking.customerName}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Expires</span>
                    <span className="info-value">{new Date(booking.endTime).toLocaleString()}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Card UID</span>
                    <span className="info-value">{booking.customerCardUid}</span>
                  </div>
                </div>
              )}

              {!isOccupied && !isExpired && (
                <div style={{ marginTop: '24px' }}>
                  <Link href={`/check-in?room=${room.number}`} className="btn" style={{ width: '100%' }}>
                    Assign Room
                  </Link>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

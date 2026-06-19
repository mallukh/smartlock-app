import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { AutoRefresh } from '@/components/AutoRefresh';
import { formatLocalDateTime } from '@/lib/date';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard - Smart Lodge Management System',
  description: 'Overview of guest check-ins, RFID door scan logs, active bed weight monitoring, and room occupancy.',
};

export const dynamic = 'force-dynamic';

export default async function Dashboard() {
  const [rooms, bedSensors, roomSensors] = await Promise.all([
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
    prisma.roomSensor.findMany(),
  ]);

  // Build lookup maps for sensors by room number
  const bedSensorMap = new Map(
    bedSensors.map((s) => [s.roomNumber, s])
  );
  const roomSensorMap = new Map(
    roomSensors.map((s) => [s.roomNumber, s])
  );

  const now = new Date();

  // Stats for bed occupancy
  const totalBeds = bedSensors.length;
  const occupiedBeds = bedSensors.filter((s) => s.isOccupied).length;

  // Stats for room occupancy
  const occupiedRooms = roomSensors.filter((s) => s.isOccupied).length;

  return (
    <div>
      <AutoRefresh intervalMs={5000} />
      <h1 className="page-title">Lodge Dashboard</h1>
      <p className="page-subtitle">Real-time status of all smart lock rooms, beds &amp; room occupancy</p>

      {/* Quick Stats */}
      <div className="dash-stats-row" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
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
          <div className="dash-stat-value" style={{ color: '#ef4444' }}>{occupiedRooms}</div>
          <div className="dash-stat-label">Rooms Occupied</div>
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
          const roomSensor = roomSensorMap.get(room.number);
          
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

          // Sensor freshness checks (stale if > 30 seconds old)
          const isSensorStale = bedSensor
            ? (now.getTime() - new Date(bedSensor.lastUpdate).getTime()) > 30000
            : false;

          const isRoomSensorStale = roomSensor
            ? (now.getTime() - new Date(roomSensor.lastUpdate).getTime()) > 30000
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
                    <span className="bed-icon">🛏️</span>
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
                    <span className="bed-icon">🛏️</span>
                    <span className="bed-status-text" style={{ color: 'var(--text-muted)' }}>No Bed Sensor</span>
                  </div>
                )}
              </div>

              {/* Room Occupancy Section */}
              <div className="room-status-section">
                {roomSensor ? (
                  <div className={`room-status-badge ${roomSensor.isOccupied ? 'room-occupied' : 'room-empty'} ${isRoomSensorStale ? 'room-stale' : ''}`}>
                    <span className="room-icon">{roomSensor.isOccupied ? '👥' : '👤'}</span>
                    <div className="bed-status-info">
                      <span className="room-status-text" style={roomSensor.isOccupied ? { color: '#ef4444' } : {}}>
                        {roomSensor.isOccupied ? 'Room Occupied' : 'Room Vacant'}
                      </span>
                      <span className="bed-weight-text">
                        {isRoomSensorStale ? (
                          'Offline'
                        ) : roomSensor.isOccupied ? (
                          roomSensor.radarPresence ? (
                            `Radar: ${roomSensor.movingDistance > 0 ? 'Moving' : 'Breathing'}`
                          ) : (
                            'PIR: Active'
                          )
                        ) : (
                          'No Presence'
                        )}
                        {isRoomSensorStale && ' • Offline'}
                      </span>
                    </div>
                    {!isRoomSensorStale && roomSensor.isOccupied && (
                      <span className="room-live-dot" style={{ background: '#ef4444', boxShadow: '0 0 6px rgba(239, 68, 68, 0.6)' }} />
                    )}
                  </div>
                ) : (
                  <div className="room-status-badge room-no-sensor">
                    <span className="room-icon">👤</span>
                    <span className="room-status-text" style={{ color: 'var(--text-muted)' }}>No Room Sensor</span>
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
                    <span className="info-value">{formatLocalDateTime(booking.endTime)}</span>
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

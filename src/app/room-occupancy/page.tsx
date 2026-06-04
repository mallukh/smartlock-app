import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { AutoRefresh } from '@/components/AutoRefresh';
import { formatLocalTime, formatLocalDateTime } from '@/lib/date';

export const dynamic = 'force-dynamic';

export default async function RoomOccupancyPage({
  searchParams,
}: {
  searchParams: Promise<{ room?: string }>;
}) {
  const params = await searchParams;
  const rooms = await prisma.room.findMany({ orderBy: { number: 'asc' } });
  const roomSensors = await prisma.roomSensor.findMany({
    orderBy: { roomNumber: 'asc' },
  });

  // Build sensor map
  const sensorMap = new Map(roomSensors.map((s) => [s.roomNumber, s]));
  const now = new Date();

  // Fetch room occupancy logs
  const logWhere: Record<string, unknown> = {};
  if (params.room) logWhere.roomNumber = params.room;

  const logs = await prisma.roomOccupancyLog.findMany({
    where: logWhere,
    orderBy: { occupiedAt: 'desc' },
    take: 200,
  });

  // Calculate live statistics
  const totalSensors = roomSensors.length;
  const occupiedCount = roomSensors.filter((s) => s.isOccupied).length;
  const vacantCount = totalSensors - occupiedCount;
  const offlineCount = roomSensors.filter(
    (s) => now.getTime() - new Date(s.lastUpdate).getTime() > 30000
  ).length;

  return (
    <>
      <AutoRefresh intervalMs={5000} />
      <h1 className="page-title">Room Occupancy</h1>
      <p className="page-subtitle">
        Real-time room occupancy tracked by PIR motion and mmWave breathing sensors
      </p>

      {/* Stats Row */}
      <div className="bed-monitor-stats">
        {[
          { label: 'Active Sensors', value: totalSensors, color: '#6366f1' },
          { label: 'Rooms Occupied', value: occupiedCount, color: '#ef4444' },
          { label: 'Rooms Vacant', value: vacantCount, color: '#10b981' },
          { label: 'Offline / Stale', value: offlineCount, color: '#94a3b8' },
        ].map((stat) => (
          <div key={stat.label} className="glass-card bed-monitor-stat-card">
            <div
              className="bed-monitor-stat-value"
              style={{ color: stat.color }}
            >
              {stat.value}
            </div>
            <div className="bed-monitor-stat-label">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Live Room Grid */}
      <h2 className="section-heading">Live Sensor Array</h2>
      <div className="room-grid">
        {rooms.map((room) => {
          const sensor = sensorMap.get(room.number);
          const isStale = sensor
            ? now.getTime() - new Date(sensor.lastUpdate).getTime() > 30000
            : false;

          return (
            <div
              key={room.id}
              className={`room-sensor-card ${
                sensor
                  ? sensor.isOccupied
                    ? 'room-sensor-occupied'
                    : 'room-sensor-empty'
                  : 'room-sensor-nosensor'
              } ${isStale ? 'room-sensor-stale' : ''}`}
            >
              <div className="room-sensor-header">
                <span className="room-sensor-number">Room {room.number}</span>
                {sensor && !isStale && sensor.isOccupied && (
                  <span className="room-live-dot" />
                )}
              </div>

              {sensor ? (
                <div className="room-sensor-body">
                  {/* PIR Status */}
                  <div className="sub-sensor-status">
                    <span className="sub-sensor-label">PIR Sensor (SR602)</span>
                    <span
                      className={`sub-sensor-value ${
                        sensor.pirTriggered ? 'sub-sensor-active' : 'sub-sensor-inactive'
                      }`}
                    >
                      {sensor.pirTriggered ? '● Motion Active' : '○ Standby'}
                    </span>
                  </div>

                  {/* mmWave Radar Presence */}
                  <div className="sub-sensor-status">
                    <span className="sub-sensor-label">Radar Presence (LD2410)</span>
                    <span
                      className={`sub-sensor-value ${
                        sensor.radarPresence ? 'sub-sensor-active' : 'sub-sensor-inactive'
                      }`}
                    >
                      {sensor.radarPresence ? '● Detected' : '○ Vacant'}
                    </span>
                  </div>

                  {/* mmWave Radar Moving Target Distance */}
                  {sensor.radarPresence && sensor.movingDistance > 0 && (
                    <div className="sub-sensor-status">
                      <span className="sub-sensor-label">Moving Distance</span>
                      <span className="sub-sensor-value" style={{ color: '#ef4444' }}>
                        {sensor.movingDistance.toFixed(1)} cm
                      </span>
                    </div>
                  )}

                  {/* mmWave Radar Stationary/Breathing Target Distance */}
                  {sensor.radarPresence && sensor.stationaryDistance > 0 && (
                    <div className="sub-sensor-status">
                      <span className="sub-sensor-label">Breathing/Still Dist</span>
                      <span className="sub-sensor-value" style={{ color: '#38bdf8' }}>
                        {sensor.stationaryDistance.toFixed(1)} cm
                      </span>
                    </div>
                  )}

                  {/* Overall Room Occupancy Status */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                    <div
                      className={`room-status-text ${
                        sensor.isOccupied ? 'text-occupied' : 'text-empty'
                      }`}
                      style={{ fontSize: '0.95rem', fontWeight: 'bold' }}
                    >
                      {isStale
                        ? '⚠ Offline'
                        : sensor.isOccupied
                        ? '● ROOM OCCUPIED'
                        : '○ ROOM VACANT'}
                    </div>
                    <div className="bed-room-updated">
                      {formatLocalTime(sensor.lastUpdate)}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="room-sensor-body" style={{ textAlign: 'center', padding: '12px 0' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    No Occupancy Sensor Configured
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* History Section */}
      <h2 className="section-heading" style={{ marginTop: '48px' }}>
        Room Occupancy Logs
      </h2>

      {/* Filter Form */}
      <form
        method="GET"
        style={{
          display: 'flex',
          gap: '16px',
          marginBottom: '24px',
          flexWrap: 'wrap',
        }}
      >
        <select
          name="room"
          className="input-field"
          style={{ maxWidth: '200px' }}
          defaultValue={params.room ?? ''}
        >
          <option value="">All Rooms</option>
          {rooms.map((r) => (
            <option key={r.id} value={r.number}>
              Room {r.number}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="btn"
          style={{ padding: '14px 24px' }}
        >
          Filter
        </button>
        <Link
          href="/room-occupancy"
          className="btn"
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          Clear
        </Link>
      </form>

      {/* Logs Table */}
      <div className="glass-card" style={{ padding: 0, overflowX: 'auto' }}>
        {logs.length === 0 ? (
          <div
            style={{
              padding: '40px',
              textAlign: 'center',
              color: 'var(--text-muted)',
            }}
          >
            No room occupancy logs found.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr
                style={{
                  borderBottom: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                {['Log ID', 'Room', 'Detected (Occupied)', 'Vacated', 'Duration'].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: '16px 20px',
                      textAlign: 'left',
                      color: 'var(--text-muted)',
                      fontWeight: '600',
                      fontSize: '0.85rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="log-row">
                  <td
                    style={{
                      padding: '14px 20px',
                      fontSize: '0.9rem',
                      color: 'rgba(255,255,255,0.7)',
                      fontWeight: '600',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    #{log.id}
                  </td>
                  <td
                    style={{ padding: '14px 20px', fontWeight: '600' }}
                  >
                    Room {log.roomNumber}
                  </td>
                  <td
                    style={{
                      padding: '14px 20px',
                      fontSize: '0.9rem',
                      color: 'var(--text-muted)',
                    }}
                  >
                    {formatLocalDateTime(log.occupiedAt)}
                  </td>
                  <td
                    style={{
                      padding: '14px 20px',
                      fontSize: '0.9rem',
                      color: 'var(--text-muted)',
                    }}
                  >
                    {log.vacatedAt ? (
                      formatLocalDateTime(log.vacatedAt)
                    ) : (
                      <span style={{ color: '#ef4444', fontWeight: '500' }}>Still Occupied...</span>
                    )}
                  </td>
                  <td
                    style={{
                      padding: '14px 20px',
                      fontFamily: 'monospace',
                      fontSize: '0.9rem',
                      color: '#94a3b8',
                      fontWeight: '600',
                    }}
                  >
                    {log.durationStr || 'Tracking...'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

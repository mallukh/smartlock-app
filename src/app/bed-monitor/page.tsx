import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { AutoRefresh } from '@/components/AutoRefresh';

export const dynamic = 'force-dynamic';

export default async function BedMonitorPage({
  searchParams,
}: {
  searchParams: Promise<{ room?: string }>;
}) {
  const params = await searchParams;
  const rooms = await prisma.room.findMany({ orderBy: { number: 'asc' } });
  const bedSensors = await prisma.bedSensor.findMany({
    orderBy: { roomNumber: 'asc' },
  });

  // Build sensor map
  const sensorMap = new Map(bedSensors.map((s) => [s.roomNumber, s]));
  const now = new Date();

  // Fetch bed logs
  const logWhere: Record<string, unknown> = {};
  if (params.room) logWhere.roomNumber = params.room;

  const logs = await prisma.bedLog.findMany({
    where: logWhere,
    orderBy: { timestamp: 'desc' },
    take: 200,
  });

  // Stats
  const totalSensors = bedSensors.length;
  const occupiedCount = bedSensors.filter((s) => s.isOccupied).length;
  const emptyCount = totalSensors - occupiedCount;
  const staleCount = bedSensors.filter(
    (s) => now.getTime() - new Date(s.lastUpdate).getTime() > 30000
  ).length;

  return (
    <>
      <AutoRefresh intervalMs={5000} />
      <h1 className="page-title">Bed Monitor</h1>
      <p className="page-subtitle">
        Real-time bed occupancy across all lodge rooms
      </p>

      {/* Stats Row */}
      <div className="bed-monitor-stats">
        {[
          { label: 'Active Sensors', value: totalSensors, color: '#6366f1' },
          { label: 'Beds Occupied', value: occupiedCount, color: '#f59e0b' },
          { label: 'Beds Empty', value: emptyCount, color: '#10b981' },
          { label: 'Offline', value: staleCount, color: '#ef4444' },
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
      <h2 className="section-heading">Live Status</h2>
      <div className="bed-grid">
        {rooms.map((room) => {
          const sensor = sensorMap.get(room.number);
          const isStale = sensor
            ? now.getTime() - new Date(sensor.lastUpdate).getTime() > 30000
            : false;

          return (
            <div
              key={room.id}
              className={`bed-room-card ${
                sensor
                  ? sensor.isOccupied
                    ? 'bed-room-occupied'
                    : 'bed-room-empty'
                  : 'bed-room-nosensor'
              } ${isStale ? 'bed-room-stale' : ''}`}
            >
              <div className="bed-room-header">
                <span className="bed-room-number">Room {room.number}</span>
                {sensor && !isStale && sensor.isOccupied && (
                  <span className="bed-live-dot" />
                )}
              </div>

              {sensor ? (
                <div className="bed-room-body">
                  <div className="bed-room-weight">
                    {sensor.weight.toFixed(1)}
                    <span className="bed-room-unit">kg</span>
                  </div>
                  <div
                    className={`bed-room-status-text ${
                      sensor.isOccupied ? 'text-occupied' : 'text-empty'
                    }`}
                  >
                    {isStale
                      ? '⚠ Offline'
                      : sensor.isOccupied
                      ? '● Occupied'
                      : '○ Empty'}
                  </div>
                  <div className="bed-room-updated">
                    {new Date(sensor.lastUpdate).toLocaleTimeString()}
                  </div>
                </div>
              ) : (
                <div className="bed-room-body">
                  <div className="bed-room-nosensor-text">No sensor</div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* History Section */}
      <h2 className="section-heading" style={{ marginTop: '48px' }}>
        Occupancy Log
      </h2>

      {/* Filter */}
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
          href="/bed-monitor"
          className="btn"
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          Clear
        </Link>
      </form>

      {/* Log Table */}
      <div className="glass-card" style={{ padding: 0, overflowX: 'auto' }}>
        {logs.length === 0 ? (
          <div
            style={{
              padding: '40px',
              textAlign: 'center',
              color: 'var(--text-muted)',
            }}
          >
            No bed occupancy records found.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr
                style={{
                  borderBottom: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                {['Timestamp', 'Room', 'Weight', 'Status'].map((h) => (
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
                      color: 'var(--text-muted)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td
                    style={{ padding: '14px 20px', fontWeight: '600' }}
                  >
                    Room {log.roomNumber}
                  </td>
                  <td
                    style={{
                      padding: '14px 20px',
                      fontFamily: 'monospace',
                      fontSize: '0.9rem',
                      color: '#94a3b8',
                    }}
                  >
                    {log.weight.toFixed(1)} kg
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    {log.isOccupied ? (
                      <span
                        style={{
                          background: 'rgba(245,158,11,0.1)',
                          color: '#f59e0b',
                          border: '1px solid #f59e0b',
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '0.82rem',
                          fontWeight: '600',
                        }}
                      >
                        ● Occupied
                      </span>
                    ) : (
                      <span
                        style={{
                          background: 'rgba(16,185,129,0.1)',
                          color: '#10b981',
                          border: '1px solid #10b981',
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '0.82rem',
                          fontWeight: '600',
                        }}
                      >
                        ○ Empty
                      </span>
                    )}
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

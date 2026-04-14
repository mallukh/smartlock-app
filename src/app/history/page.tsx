import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { AutoRefresh } from '@/components/AutoRefresh';

export const dynamic = 'force-dynamic';

const CARD_TYPE_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  MASTER:   { bg: 'rgba(168, 85, 247, 0.15)', color: '#a855f7', label: 'Master' },
  MANAGER:  { bg: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', label: 'Manager' },
  CUSTOMER: { bg: 'rgba(16, 185, 129, 0.15)', color: '#10b981', label: 'Customer' },
  UNKNOWN:  { bg: 'rgba(239, 68, 68, 0.15)',  color: '#ef4444', label: 'Unknown' },
};

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ room?: string; result?: string }>;
}) {
  const params = await searchParams;
  const rooms = await prisma.room.findMany({ orderBy: { number: 'asc' } });

  const where: Record<string, unknown> = {};
  if (params.room) where.roomNumber = params.room;
  if (params.result === 'granted')  where.accessGranted = true;
  if (params.result === 'denied')   where.accessGranted = false;

  const logs = await prisma.scanLog.findMany({
    where,
    orderBy: { timestamp: 'desc' },
    take: 200,
  });

  return (
    <>
      <AutoRefresh intervalMs={5000} />
      <h1 className="page-title">Scan History</h1>
      <p className="page-subtitle">All RFID card access attempts logged in real-time</p>

      {/* Filter Bar */}
      <form method="GET" style={{ display: 'flex', gap: '16px', marginBottom: '32px', flexWrap: 'wrap' }}>
        <select name="room" className="input-field" style={{ maxWidth: '200px' }} defaultValue={params.room ?? ''}>
          <option value="">All Rooms</option>
          {rooms.map(r => (
            <option key={r.id} value={r.number}>Room {r.number}</option>
          ))}
        </select>
        <select name="result" className="input-field" style={{ maxWidth: '200px' }} defaultValue={params.result ?? ''}>
          <option value="">All Results</option>
          <option value="granted">Access Granted</option>
          <option value="denied">Access Denied</option>
        </select>
        <button type="submit" className="btn" style={{ padding: '14px 24px' }}>Filter</button>
        <Link href="/history" className="btn" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
          Clear
        </Link>
      </form>

      {/* Stats Row */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '32px', flexWrap: 'wrap' }}>
        {[
          { label: 'Total Scans', value: logs.length, color: '#6366f1' },
          { label: 'Granted', value: logs.filter(l => l.accessGranted).length, color: '#10b981' },
          { label: 'Denied', value: logs.filter(l => !l.accessGranted).length, color: '#ef4444' },
        ].map(stat => (
          <div key={stat.label} className="glass-card" style={{ flex: '1', minWidth: '140px', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: '700', color: stat.color }}>{stat.value}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="glass-card" style={{ padding: 0, overflowX: 'auto' }}>
        {logs.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No scan records found.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                {['Timestamp', 'Room', 'Card UID', 'Card Type', 'Result', 'Reason'].map(h => (
                  <th key={h} style={{ padding: '16px 20px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map((log, i) => {
                const typeStyle = CARD_TYPE_STYLE[log.cardType] ?? CARD_TYPE_STYLE.UNKNOWN;
                return (
                  <tr
                    key={log.id}
                    className="log-row"
                  >
                    <td style={{ padding: '14px 20px', fontSize: '0.9rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td style={{ padding: '14px 20px', fontWeight: '600' }}>Room {log.roomNumber}</td>
                    <td style={{ padding: '14px 20px', fontFamily: 'monospace', fontSize: '0.9rem', color: '#94a3b8' }}>{log.cardUid}</td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{ background: typeStyle.bg, color: typeStyle.color, border: `1px solid ${typeStyle.color}`, padding: '4px 10px', borderRadius: '12px', fontSize: '0.82rem', fontWeight: '600' }}>
                        {typeStyle.label}
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      {log.accessGranted ? (
                        <span style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid #10b981', padding: '4px 10px', borderRadius: '12px', fontSize: '0.82rem', fontWeight: '600' }}>✓ Granted</span>
                      ) : (
                        <span style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid #ef4444', padding: '4px 10px', borderRadius: '12px', fontSize: '0.82rem', fontWeight: '600' }}>✗ Denied</span>
                      )}
                    </td>
                    <td style={{ padding: '14px 20px', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                      {log.reason ?? '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

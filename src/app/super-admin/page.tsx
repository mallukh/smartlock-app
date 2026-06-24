import { prisma } from '@/lib/prisma';
import { createLodge, createLodgeUser, deleteLodge } from './actions';
import { formatLocalDateTime } from '@/lib/date';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Super Admin Workspace - Smart Lodge',
  description: 'Manage SaaS platform lodge tenants, system admins, and overall hardware statistics.',
};

export const dynamic = 'force-dynamic';

export default async function SuperAdminPage() {
  const [lodges, adminUsers, totalRooms, totalLogs] = await Promise.all([
    prisma.lodge.findMany({
      include: {
        users: {
          where: { role: 'LODGE_ADMIN' }
        },
        _count: {
          select: { rooms: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.user.findMany({
      where: { role: 'LODGE_ADMIN' }
    }),
    prisma.room.count(),
    prisma.scanLog.count(),
  ]);

  return (
    <>
      <h1 className="page-title">SaaS Workspace</h1>
      <p className="page-subtitle">Centralized administration of lodges, user accounts, and telemetry nodes</p>

      {/* Platform Statistics */}
      <div className="dash-stats-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '40px' }}>
        <div className="dash-stat-card">
          <div className="dash-stat-value" style={{ color: '#6366f1' }}>{lodges.length}</div>
          <div className="dash-stat-label">Total Lodges</div>
        </div>
        <div className="dash-stat-card">
          <div className="dash-stat-value" style={{ color: '#a855f7' }}>{adminUsers.length}</div>
          <div className="dash-stat-label">Lodge Admins</div>
        </div>
        <div className="dash-stat-card">
          <div className="dash-stat-value" style={{ color: '#10b981' }}>{totalRooms}</div>
          <div className="dash-stat-label">Total Rooms</div>
        </div>
        <div className="dash-stat-card">
          <div className="dash-stat-value" style={{ color: '#f59e0b' }}>{totalLogs}</div>
          <div className="dash-stat-label">Telemetry Events</div>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: '40px' }}>
        {/* Create Lodge Form */}
        <div className="glass-card">
          <h2 style={{ fontSize: '1.25rem', marginTop: 0, marginBottom: '8px', fontWeight: 600 }}>Create New Lodge</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
            Register a new client entity. This generates a unique API key for their hardware integration.
          </p>
          <form action={createLodge}>
            <div className="form-group">
              <label className="form-label">Lodge Name</label>
              <input type="text" name="name" required placeholder="e.g. Grand Cascade Lodge" className="input-field" />
            </div>
            <div className="form-group">
              <label className="form-label">Lodge Code (URL/Slug - alphanumeric)</label>
              <input type="text" name="code" required placeholder="e.g. grandcascade" className="input-field" />
            </div>
            <button type="submit" className="btn" style={{ width: '100%', marginTop: '8px' }}>
              Create Lodge Entity
            </button>
          </form>
        </div>

        {/* Create Lodge User Form */}
        <div className="glass-card">
          <h2 style={{ fontSize: '1.25rem', marginTop: 0, marginBottom: '8px', fontWeight: 600 }}>Register Lodge Administrator</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
            Create a lodge owner login. They will be authorized to manage their assigned lodge workspace.
          </p>
          <form action={createLodgeUser}>
            <div className="form-group">
              <label className="form-label">Select Associated Lodge</label>
              <select name="lodgeId" required className="input-field" style={{ background: 'rgba(0,0,0,0.4)', color: 'white' }}>
                <option value="" disabled selected>Choose a lodge</option>
                {lodges.map(l => (
                  <option key={l.id} value={l.id}>{l.name} ({l.code})</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Admin Full Name</label>
              <input type="text" name="name" required placeholder="John Owner" className="input-field" />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input type="email" name="email" required placeholder="john@lodge.com" className="input-field" />
            </div>
            <div className="form-group">
              <label className="form-label">Access Password</label>
              <input type="password" name="password" required placeholder="••••••••" className="input-field" />
            </div>
            <button type="submit" className="btn" style={{ width: '100%', marginTop: '8px' }}>
              Create Administrator Account
            </button>
          </form>
        </div>
      </div>

      {/* Lodges Directory */}
      <h2 style={{ fontSize: '1.3rem', color: 'var(--text-main)', marginBottom: '16px', fontWeight: 600 }}>Registered Lodges Directory</h2>
      <div className="glass-card" style={{ padding: 0, overflowX: 'auto', marginBottom: '60px' }}>
        {lodges.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No lodges registered yet.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                {['Lodge Details', 'Slug Code', 'Hardware API Key', 'Rooms / Users', 'Created', 'Action'].map(h => (
                  <th key={h} style={{ padding: '16px 20px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lodges.map(lodge => (
                <tr key={lodge.id} className="log-row" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ fontWeight: '600', fontSize: '1rem', color: 'var(--text-main)' }}>{lodge.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ID: {lodge.id}</div>
                  </td>
                  <td style={{ padding: '16px 20px', fontFamily: 'monospace', fontSize: '0.9rem', color: '#a855f7' }}>
                    {lodge.code}
                  </td>
                  <td style={{ padding: '16px 20px', fontFamily: 'monospace', fontSize: '0.85rem', color: '#a5b4fc' }}>
                    {lodge.apiKey}
                  </td>
                  <td style={{ padding: '16px 20px', fontSize: '0.9rem' }}>
                    <div style={{ fontWeight: '500' }}>Rooms: {lodge._count.rooms}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Admins: {lodge.users.length}</div>
                  </td>
                  <td style={{ padding: '16px 20px', fontSize: '0.85rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {formatLocalDateTime(lodge.createdAt)}
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <form action={deleteLodge}>
                      <input type="hidden" name="id" value={lodge.id} />
                      <button type="submit" className="btn" style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444', padding: '6px 14px', fontSize: '0.85rem' }}>
                        Delete Lodge
                      </button>
                    </form>
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

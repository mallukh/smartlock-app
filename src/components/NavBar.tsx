'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';

export default function NavBar() {
  const { data: session } = useSession();
  const pathname = usePathname();

  // Hide nav on auth pages
  const authPaths = ['/login', '/signup', '/forgot-password'];
  if (authPaths.some((p) => pathname.startsWith(p))) {
    return null;
  }

  return (
    <nav className="nav">
      <Link href="/" className="nav-logo" style={{ textDecoration: 'none' }}>
        SMART LODGE
      </Link>
      <div className="nav-links">
        <Link href="/" className="nav-link">Dashboard</Link>
        <Link href="/check-in" className="nav-link">Check In</Link>
        <Link href="/history" className="nav-link">Lock History</Link>
        <Link href="/bed-monitor" className="nav-link">Bed Monitor</Link>
        <Link href="/settings" className="nav-link">Settings</Link>
      </div>
      {session?.user && (
        <div className="nav-auth">
          <span className="nav-user">{session.user.name}</span>
          <button
            className="btn-logout"
            onClick={() => signOut({ callbackUrl: '/login' })}
          >
            Logout
          </button>
        </div>
      )}
    </nav>
  );
}

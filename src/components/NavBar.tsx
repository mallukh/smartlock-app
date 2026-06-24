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
      <Link 
        href={session ? (session.user?.role === 'SUPER_ADMIN' ? "/super-admin" : "/dashboard") : "/"} 
        className="nav-logo" 
        style={{ textDecoration: 'none' }}
      >
        SMART LODGE
      </Link>
      <div className="nav-links">
        {session ? (
          session.user?.role === 'SUPER_ADMIN' ? (
            <>
              <Link href="/super-admin" className={`nav-link ${pathname === '/super-admin' ? 'active' : ''}`}>Workspace</Link>
            </>
          ) : (
            <>
              <Link href="/dashboard" className={`nav-link ${pathname === '/dashboard' ? 'active' : ''}`}>Dashboard</Link>
              <Link href="/check-in" className={`nav-link ${pathname === '/check-in' ? 'active' : ''}`}>Check In</Link>
              <Link href="/history" className={`nav-link ${pathname === '/history' ? 'active' : ''}`}>Lock History</Link>
              <Link href="/bed-monitor" className={`nav-link ${pathname === '/bed-monitor' ? 'active' : ''}`}>Bed Monitor</Link>
              <Link href="/room-occupancy" className={`nav-link ${pathname === '/room-occupancy' ? 'active' : ''}`}>Room Occupancy</Link>
              <Link href="/settings" className={`nav-link ${pathname === '/settings' ? 'active' : ''}`}>Settings</Link>
            </>
          )
        ) : (
          <>
            <Link href="/" className={`nav-link ${pathname === '/' ? 'active' : ''}`}>Home</Link>
            <Link href="/about" className={`nav-link ${pathname === '/about' ? 'active' : ''}`}>About Us</Link>
            <Link href="/contact" className={`nav-link ${pathname === '/contact' ? 'active' : ''}`}>Contact</Link>
            <Link href="/register" className={`nav-link ${pathname === '/register' ? 'active' : ''}`}>Register</Link>
          </>
        )}
      </div>
      <div className="nav-auth">
        {session?.user ? (
          <>
            <span className="nav-user">{session.user.name}</span>
            <button
              className="btn-logout"
              onClick={() => signOut({ callbackUrl: '/' })}
            >
              Logout
            </button>
          </>
        ) : (
          <Link href="/login" className="btn-login">
            Staff Login
          </Link>
        )}
      </div>
    </nav>
  );
}

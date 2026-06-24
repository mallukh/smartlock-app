import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // If not logged in, go to login
  if (!session || !session.user) {
    redirect('/login');
  }

  // If logged in but not a Super Admin, redirect to regular dashboard
  if (session.user.role !== 'SUPER_ADMIN') {
    redirect('/dashboard');
  }

  return (
    <div style={{ animation: 'cardAppear 0.5s ease' }}>
      {children}
    </div>
  );
}

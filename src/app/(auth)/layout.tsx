import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Authentication - Smart Lodge',
  description: 'Log in or register your account to manage the Smart Lodge access control system.',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="auth-page">
      <div className="auth-bg-orb auth-bg-orb-1" />
      <div className="auth-bg-orb auth-bg-orb-2" />
      <div className="auth-bg-orb auth-bg-orb-3" />
      {children}
    </div>
  );
}

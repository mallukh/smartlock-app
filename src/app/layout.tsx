import './globals.css';
import type { Metadata } from 'next';
import Providers from '@/components/Providers';
import NavBar from '@/components/NavBar';

export const metadata: Metadata = {
  title: 'SMART LODGE',
  description: 'Manage RFID door locks and lodge bookings dynamically.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <NavBar />
          <main className="container">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}

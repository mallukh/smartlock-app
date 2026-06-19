import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About Us - Smart Lodge Automation',
  description: 'Learn about the technology stack and mission behind Smart Lodge—providing secure, automated, and privacy-respecting lodge management solutions.',
};

export default function About() {
  return (
    <div className="public-container">
      <h1 className="page-title">About Smart Lodge</h1>
      <p className="page-subtitle">The intersection of IoT hardware automation and guest convenience</p>

      <div className="public-info-card">
        <h2 style={{ fontSize: '1.5rem', marginBottom: '16px', fontWeight: 600 }}>Our Vision</h2>
        <p className="public-p">
          Smart Lodge was created to reimagine hospitality by introducing fully integrated IoT hardware systems that simplify administration and enhance guest safety. We believe that guest spaces can be smart, reactive, and highly secure, without ever compromising personal privacy.
        </p>

        <h2 style={{ fontSize: '1.5rem', marginTop: '32px', marginBottom: '16px', fontWeight: 600 }}>Our Technology Stack</h2>
        <p className="public-p">
          Smart Lodge is built on top of a robust edge computing architecture:
        </p>
        <ul style={{ paddingLeft: '20px', color: 'var(--text-muted)', lineHeight: '1.8', marginBottom: '24px' }}>
          <li>
            <strong>ESP32 Microcontrollers</strong> running optimized firmware to control lock solenoids, read high-precision weight data, and process motion triggers.
          </li>
          <li>
            <strong>RC522 RFID Scanners</strong> for millisecond card validation, supporting easy card enrollment and instant access termination.
          </li>
          <li>
            <strong>mmWave Radar &amp; PIR Arrays</strong> that work in tandem to detect human presence by measuring micro-motions like respiration, ensuring accuracy even when guests are completely still.
          </li>
          <li>
            <strong>HX711 Amplifiers &amp; Load Cells</strong> integrated into bed frames to monitor load changes, providing real-time data on room activity and bed availability.
          </li>
          <li>
            <strong>Next.js &amp; Prisma</strong> on the backend to synchronize hardware event streams with SQL databases for real-time web console updates.
          </li>
        </ul>

        <h2 style={{ fontSize: '1.5rem', marginTop: '32px', marginBottom: '16px', fontWeight: 600 }}>Privacy-First Commitment</h2>
        <p className="public-p">
          We strictly reject the use of optical cameras or microphones in guest areas. Our presence-detection mechanisms rely entirely on non-identifying physical telemetry (heat, micro-radar reflections, and weight), keeping guest stays completely private and secure.
        </p>

        <div style={{ marginTop: '40px', textAlign: 'center' }}>
          <Link href="/register" className="btn">
            Inquire for a Room
          </Link>
        </div>
      </div>
    </div>
  );
}

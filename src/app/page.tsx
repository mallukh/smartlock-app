import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Smart Lodge - Privacy-First Smart Accommodation',
  description: 'Smart Lodge provides state-of-the-art automated accommodation powered by secure RFID door entry, mmWave occupancy radar, and real-time bed weight sensing.',
};

export default function Home() {
  return (
    <div>
      {/* Hero Section */}
      <section className="hero-section">
        <h1 className="hero-title">
          Experience the Future of Smart Hospitality
        </h1>
        <p className="hero-subtitle">
          Smart Lodge integrates advanced IoT automation with premium guest comfort. Fully secure RFID doors, privacy-first mmWave presence detection, and active bed weight monitoring.
        </p>
        <div className="hero-ctas">
          <Link href="/register" className="btn">
            Book an Inquiry
          </Link>
          <Link href="/about" className="btn" style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--card-border)', color: 'var(--text-main)' }}>
            Learn More
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <div className="features-grid">
        <div className="feature-card">
          <div className="feature-icon-wrapper">🔑</div>
          <h3 className="feature-title">Contactless Smart Access</h3>
          <p className="feature-description">
            High-speed RFID door controller scans and validates guest badges instantly. Real-time telemetry records access attempts and security violations to our centralized database.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon-wrapper">📡</div>
          <h3 className="feature-title">Privacy-First Occupancy</h3>
          <p className="feature-description">
            Dual-technology sensor arrays combining PIR motion and 24GHz mmWave radar detect micro-movements, breathing, and presence. Highly accurate and 100% camera-free.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon-wrapper">🛏️</div>
          <h3 className="feature-title">Precision Bed Monitoring</h3>
          <p className="feature-description">
            Under-bed load cell sensors and HX711 ADCs measure tiny structural weight changes, notifying the system when a guest is asleep or active. Fully automated check-out signals.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon-wrapper">🛡️</div>
          <h3 className="feature-title">Enterprise Dashboard</h3>
          <p className="feature-description">
            Administrative workspace displaying live status of all rooms, door lock logs, occupancy histories, sensor telemetry, check-in operations, and smart system settings.
          </p>
        </div>
      </div>

      {/* Call to Action Banner */}
      <section className="cta-banner">
        <div className="cta-banner-content">
          <h2 style={{ fontSize: '2rem', marginBottom: '16px', fontWeight: 700 }}>Ready to experience next-gen living?</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '32px', maxWidth: '600px', margin: '0 auto 32px' }}>
            Submit a booking inquiry or contact our automation team to see how Smart Lodge transforms modern rental spaces.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <Link href="/register" className="btn">
              Register / Inquire
            </Link>
            <Link href="/contact" className="btn" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--card-border)', color: 'var(--text-main)' }}>
              Get in Touch
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

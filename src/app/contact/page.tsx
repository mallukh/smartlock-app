import type { Metadata } from 'next';
import ContactForm from '@/components/ContactForm';

export const metadata: Metadata = {
  title: 'Contact Us - Smart Lodge Support',
  description: 'Get in touch with the Smart Lodge support team or hardware administrators for inquiries, support requests, and billing issues.',
};

export default function ContactPage() {
  return (
    <div className="public-container" style={{ maxWidth: '1000px' }}>
      <h1 className="page-title">Contact Our Team</h1>
      <p className="page-subtitle">Have questions about booking or smart lodge systems? We are here to help.</p>

      <div className="contact-grid">
        {/* Left Side: Contact Form */}
        <div>
          <ContactForm />
        </div>

        {/* Right Side: Contact Information & Hours */}
        <div className="contact-info-list" style={{ marginTop: '12px' }}>
          <div className="contact-info-item">
            <div className="contact-info-icon">📍</div>
            <div className="contact-info-text">
              <h3>Lodge Location</h3>
              <p>128 Innovation Way, Suite B</p>
              <p>Silicon Valley, CA 94025</p>
            </div>
          </div>

          <div className="contact-info-item">
            <div className="contact-info-icon">📧</div>
            <div className="contact-info-text">
              <h3>General &amp; Sales Inquiry</h3>
              <p>info@smartlock-app.com</p>
              <p>sales@smartlock-app.com</p>
            </div>
          </div>

          <div className="contact-info-item">
            <div className="contact-info-icon">📞</div>
            <div className="contact-info-text">
              <h3>Support Phone</h3>
              <p>+1 (555) 489-3281</p>
              <p>Toll-free: +1 (800) 555-8910</p>
            </div>
          </div>

          <div className="contact-info-item">
            <div className="contact-info-icon">🕒</div>
            <div className="contact-info-text">
              <h3>Operating Hours</h3>
              <p>Monday - Friday: 8:00 AM - 6:00 PM PST</p>
              <p>Saturday: 9:00 AM - 4:00 PM PST</p>
              <p style={{ color: 'var(--success)', fontWeight: 600, fontSize: '0.85rem', marginTop: '4px' }}>
                • 24/7 emergency support for checked-in guests
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

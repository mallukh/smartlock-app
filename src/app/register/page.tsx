import type { Metadata } from 'next';
import RegisterForm from '@/components/RegisterForm';

export const metadata: Metadata = {
  title: 'Register & Inquire - Smart Lodge Booking',
  description: 'Inquire about staying at Smart Lodge. Register details for automated RFID key assignment, check-in schedules, and room automation preferences.',
};

export default function RegisterPage() {
  return (
    <div className="public-container" style={{ maxWidth: '600px' }}>
      <h1 className="page-title">Booking Inquiry</h1>
      <p className="page-subtitle">Register your details below to schedule a stay in our automated smart suites.</p>
      
      <div style={{ marginTop: '24px' }}>
        <RegisterForm />
      </div>
    </div>
  );
}

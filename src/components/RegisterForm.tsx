'use client';

import React, { useState } from 'react';

export default function RegisterForm() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    roomType: 'single',
    checkIn: '',
    checkOut: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.checkIn || !formData.checkOut) {
      alert('Please fill out all required fields.');
      return;
    }

    setLoading(true);
    // Simulate API request delay
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setLoading(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="auth-card" style={{ animation: 'popIn 0.5s ease forwards', textAlignment: 'center', padding: '40px 24px' }}>
        <div className="auth-success-icon">✓</div>
        <h2 className="auth-success-title">Inquiry Submitted!</h2>
        <p className="auth-success-text" style={{ marginBottom: '24px' }}>
          Thank you, {formData.name}. Your room booking inquiry for a <strong>{formData.roomType === 'single' ? 'Single Suite' : formData.roomType === 'double' ? 'Double Suite' : 'Executive Penthouse'}</strong> has been registered.
        </p>
        <div style={{ background: 'rgba(255, 255, 255, 0.03)', borderRadius: '12px', padding: '16px', marginBottom: '24px', textAlign: 'left', fontSize: '0.9rem', border: '1px solid var(--card-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Check-in:</span>
            <span>{formData.checkIn}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Check-out:</span>
            <span>{formData.checkOut}</span>
          </div>
        </div>
        <p className="public-p" style={{ fontSize: '0.9rem' }}>
          Our reservation manager will email you at <strong>{formData.email}</strong> to finalize lock credentials and assign your RFID access badge.
        </p>
        <button className="btn" style={{ width: '100%', marginTop: '16px' }} onClick={() => {
          setSubmitted(false);
          setFormData({ name: '', email: '', phone: '', roomType: 'single', checkIn: '', checkOut: '', notes: '' });
        }}>
          Register Another Inquiry
        </button>
      </div>
    );
  }

  return (
    <form className="glass-card auth-form" onSubmit={handleSubmit} style={{ animation: 'cardAppear 0.5s ease' }}>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '20px', fontWeight: 600 }}>Room Booking Inquiry</h2>

      <div className="form-group">
        <label className="form-label">Full Name *</label>
        <input
          type="text"
          required
          placeholder="Jane Doe"
          className="input-field"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
      </div>

      <div className="grid-2">
        <div className="form-group">
          <label className="form-label">Email Address *</label>
          <input
            type="email"
            required
            placeholder="jane@example.com"
            className="input-field"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Phone Number</label>
          <input
            type="tel"
            placeholder="+1 (555) 019-2834"
            className="input-field"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Select Room Type *</label>
        <select
          className="input-field"
          style={{ background: 'rgba(0,0,0,0.4)', color: 'white' }}
          value={formData.roomType}
          onChange={(e) => setFormData({ ...formData, roomType: e.target.value })}
        >
          <option value="single">Single Suite (Smart Bed + mmWave Occupancy)</option>
          <option value="double">Double Suite (2x Smart Beds + Presence Radar)</option>
          <option value="executive">Executive Penthouse (Full RFID Suite + Private Deck)</option>
        </select>
      </div>

      <div className="grid-2">
        <div className="form-group">
          <label className="form-label">Check-in Date *</label>
          <input
            type="date"
            required
            className="input-field"
            style={{ color: 'white' }}
            value={formData.checkIn}
            onChange={(e) => setFormData({ ...formData, checkIn: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Check-out Date *</label>
          <input
            type="date"
            required
            className="input-field"
            style={{ color: 'white' }}
            value={formData.checkOut}
            onChange={(e) => setFormData({ ...formData, checkOut: e.target.value })}
          />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Additional Requests / Preferences</label>
        <textarea
          rows={3}
          placeholder="Special access needs, arrival details, etc."
          className="input-field"
          style={{ resize: 'vertical', fontFamily: 'inherit' }}
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        />
      </div>

      <button className="btn" type="submit" disabled={loading} style={{ width: '100%', marginTop: '12px' }}>
        {loading ? <span className="auth-spinner" /> : 'Submit Booking Inquiry'}
      </button>
    </form>
  );
}

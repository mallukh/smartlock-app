'use client';

import React, { useState } from 'react';

export default function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      alert('Please fill out all required fields.');
      return;
    }

    setLoading(true);
    // Simulate API request delay
    await new Promise((resolve) => setTimeout(resolve, 800));
    setLoading(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="auth-card" style={{ animation: 'popIn 0.5s ease forwards', textAlignment: 'center', padding: '40px 24px' }}>
        <div className="auth-success-icon">✓</div>
        <h2 className="auth-success-title">Message Sent!</h2>
        <p className="auth-success-text" style={{ marginBottom: '24px' }}>
          Thank you, {formData.name}. We have received your inquiry and our support team will reach out to you shortly.
        </p>
        <button className="btn" style={{ width: '100%' }} onClick={() => {
          setSubmitted(false);
          setFormData({ name: '', email: '', subject: '', message: '' });
        }}>
          Send Another Message
        </button>
      </div>
    );
  }

  return (
    <form className="glass-card auth-form" onSubmit={handleSubmit} style={{ animation: 'cardAppear 0.5s ease' }}>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '20px', fontWeight: 600 }}>Send Us a Message</h2>
      
      <div className="form-group">
        <label className="form-label">Name *</label>
        <input
          type="text"
          required
          placeholder="John Doe"
          className="input-field"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Email Address *</label>
        <input
          type="email"
          required
          placeholder="john@example.com"
          className="input-field"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Subject</label>
        <input
          type="text"
          placeholder="Lodge automation details / Booking inquiry"
          className="input-field"
          value={formData.subject}
          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Message *</label>
        <textarea
          required
          rows={4}
          placeholder="Tell us about your requirements..."
          className="input-field"
          style={{ resize: 'vertical', fontFamily: 'inherit' }}
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
        />
      </div>

      <button className="btn" type="submit" disabled={loading} style={{ width: '100%', marginTop: '12px' }}>
        {loading ? <span className="auth-spinner" /> : 'Submit Inquiry'}
      </button>
    </form>
  );
}

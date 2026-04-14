'use client';

import { useState } from 'react';
import Link from 'next/link';
import { resetPasswordAction } from './actions';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [tempPassword, setTempPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setTempPassword('');
    setLoading(true);

    try {
      const result = await resetPasswordAction(email);

      if (result.error) {
        setError(result.error);
        setLoading(false);
        return;
      }

      setTempPassword(result.tempPassword || '');
      setLoading(false);
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="40" height="40" rx="12" fill="url(#lock-grad3)" />
              <path d="M20 14C17.79 14 16 15.79 16 18V20H14V28H26V20H24V18C24 15.79 22.21 14 20 14ZM22 20H18V18C18 16.9 18.9 16 20 16C21.1 16 22 16.9 22 18V20Z" fill="white" />
              <defs>
                <linearGradient id="lock-grad3" x1="0" y1="0" x2="40" y2="40">
                  <stop stopColor="#6366f1" />
                  <stop offset="1" stopColor="#a855f7" />
                </linearGradient>
              </defs>
            </svg>
            <span className="auth-logo-text">SmartLock</span>
          </div>
          <h1 className="auth-title">Reset password</h1>
          <p className="auth-subtitle">Enter your email to get a temporary password</p>
        </div>

        {error && (
          <div className="auth-error">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 1C4.13 1 1 4.13 1 8s3.13 7 7 7 7-3.13 7-7-3.13-7-7-7zm.5 10.5h-1v-1h1v1zm0-2h-1v-5h1v5z" />
            </svg>
            {error}
          </div>
        )}

        {tempPassword ? (
          <div className="auth-success-card">
            <div className="auth-success-icon">✓</div>
            <h3 className="auth-success-title">Password Reset</h3>
            <p className="auth-success-text">Your new temporary password is:</p>
            <div className="auth-temp-password">{tempPassword}</div>
            <p className="auth-success-hint">Use this password to sign in, then change it in settings.</p>
            <Link href="/login" className="btn auth-btn" style={{ marginTop: '16px' }}>
              Go to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="reset-email" className="form-label">Email address</label>
              <input
                id="reset-email"
                type="email"
                className="input-field"
                placeholder="manager@lodge.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <button type="submit" className="btn auth-btn" disabled={loading}>
              {loading ? (
                <span className="auth-spinner" />
              ) : (
                'Reset Password'
              )}
            </button>
          </form>
        )}

        <div className="auth-footer">
          <span className="auth-footer-text">Remember your password?</span>
          <Link href="/login" className="auth-link">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

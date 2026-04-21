'use client';

import { useState, useEffect } from 'react';

export default function IotLedPage() {
  const [ledState, setLedState] = useState<'ON' | 'OFF'>('OFF');
  const [loading, setLoading] = useState(true);

  // Fetch initial state
  useEffect(() => {
    const fetchState = async () => {
      try {
        const res = await fetch('/api/iot-led');
        const text = await res.text();
        if (text === 'ON' || text === 'OFF') {
          setLedState(text);
        }
      } catch (err) {
        console.error('Failed to fetch LED state', err);
      } finally {
        setLoading(false);
      }
    };
    
    // Initial fetch
    fetchState();
    
    // Poll every 2 seconds to keep UI synced
    const interval = setInterval(fetchState, 2000);
    return () => clearInterval(interval);
  }, []);

  const toggleLed = async (newState: 'ON' | 'OFF') => {
    setLoading(true);
    try {
      const res = await fetch('/api/iot-led', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: newState }),
      });
      if (res.ok) {
        setLedState(newState);
      }
    } catch (err) {
      console.error('Failed to update LED state', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#111827',
      color: '#f3f4f6',
      fontFamily: 'Inter, sans-serif'
    }}>
      
      <div style={{
        background: 'rgba(31, 41, 55, 0.7)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '24px',
        padding: '3rem',
        textAlign: 'center',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        width: '100%',
        maxWidth: '450px'
      }}>
        <h1 style={{ 
          fontSize: '2rem', 
          fontWeight: '700', 
          marginBottom: '2rem',
          background: 'linear-gradient(135deg, #a855f7 0%, #3b82f6 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          IoT LED Controller
        </h1>

        {/* LED Indicator */}
        <div style={{
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          margin: '0 auto 2.5rem auto',
          background: ledState === 'ON' ? '#3b82f6' : '#374151',
          boxShadow: ledState === 'ON' 
            ? '0 0 40px #3b82f6, inset 0 0 20px rgba(255,255,255,0.5)' 
            : 'inset 0 0 20px rgba(0,0,0,0.5)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}>
           <div style={{
             width: '60%',
             height: '60%',
             borderRadius: '50%',
             background: ledState === 'ON' 
                ? 'radial-gradient(circle at 30% 30%, #93c5fd, #3b82f6)' 
                : 'radial-gradient(circle at 30% 30%, #4b5563, #374151)',
           }}></div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button 
            onClick={() => toggleLed('ON')}
            disabled={loading || ledState === 'ON'}
            style={{
              padding: '12px 32px',
              fontSize: '1.1rem',
              fontWeight: '600',
              borderRadius: '12px',
              border: 'none',
              cursor: (loading || ledState === 'ON') ? 'not-allowed' : 'pointer',
              background: (ledState === 'ON') 
                 ? 'rgba(59, 130, 246, 0.5)' 
                 : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              boxShadow: ledState !== 'ON' ? '0 4px 14px 0 rgba(16, 185, 129, 0.39)' : 'none',
              transform: ledState === 'ON' ? 'scale(0.98)' : 'scale(1)',
              transition: 'all 0.2s',
              opacity: (loading && ledState !== 'ON') ? 0.7 : 1
            }}
            onMouseOver={(e) => { if(ledState !== 'ON') e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseOut={(e) => { if(ledState !== 'ON') e.currentTarget.style.transform = 'translateY(0)' }}
          >
            TURN ON
          </button>
          
          <button 
            onClick={() => toggleLed('OFF')}
            disabled={loading || ledState === 'OFF'}
            style={{
              padding: '12px 32px',
              fontSize: '1.1rem',
              fontWeight: '600',
              borderRadius: '12px',
              border: 'none',
              cursor: (loading || ledState === 'OFF') ? 'not-allowed' : 'pointer',
              background: (ledState === 'OFF')
                 ? 'rgba(239, 68, 68, 0.3)'
                 : 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
              color: 'white',
              boxShadow: ledState !== 'OFF' ? '0 4px 14px 0 rgba(239, 68, 68, 0.39)' : 'none',
              transform: ledState === 'OFF' ? 'scale(0.98)' : 'scale(1)',
              transition: 'all 0.2s',
              opacity: (loading && ledState !== 'OFF') ? 0.7 : 1
            }}
            onMouseOver={(e) => { if(ledState !== 'OFF') e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseOut={(e) => { if(ledState !== 'OFF') e.currentTarget.style.transform = 'translateY(0)' }}
          >
            TURN OFF
          </button>
        </div>
        
        <p style={{ marginTop: '2rem', fontSize: '0.85rem', color: '#9ca3af' }}>
          Current State: <strong style={{ color: ledState === 'ON' ? '#60a5fa' : '#fca5a5' }}>{ledState}</strong>
        </p>
      </div>
    </div>
  );
}

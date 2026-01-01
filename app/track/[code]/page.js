'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';

export default function TrackPage() {
  const params = useParams();
  const [delivery, setDelivery] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [btnText, setBtnText] = useState('Share My Location');
  const [btnDisabled, setBtnDisabled] = useState(true);

  const bestPositionRef = useRef(null);
  const watchIdRef = useRef(null);
  const attemptsRef = useRef(0);

  useEffect(() => {
    fetchDelivery();
    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const fetchDelivery = async () => {
    try {
      const res = await fetch(`/api/deliveries/${params.code}`);
      const data = await res.json();

      if (data.error) {
        setError(data.error);
      } else {
        setDelivery(data.delivery);
      }
    } catch (err) {
      setError('Failed to load delivery');
    }
    setLoading(false);
  };

  const handleConsentChange = (e) => {
    setConsent(e.target.checked);
    setBtnDisabled(!e.target.checked);
  };

  const shareLocation = () => {
    setBtnDisabled(true);
    setBtnText('Getting GPS...');
    setStatus({ type: 'loading', message: 'Acquiring precise GPS location... Please wait.' });

    if (!navigator.geolocation) {
      setStatus({ type: 'error', message: 'Geolocation is not supported by your browser.' });
      setBtnDisabled(false);
      setBtnText('Share My Location');
      return;
    }

    bestPositionRef.current = null;
    attemptsRef.current = 0;
    const maxAttempts = 10;
    const targetAccuracy = 20;

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        attemptsRef.current++;
        const accuracy = position.coords.accuracy;

        if (!bestPositionRef.current || accuracy < bestPositionRef.current.coords.accuracy) {
          bestPositionRef.current = position;
        }

        setStatus({ type: 'loading', message: `Getting precise location... (Accuracy: ${Math.round(bestPositionRef.current.coords.accuracy)}m)` });
        setBtnText(`GPS Lock: ${Math.round(bestPositionRef.current.coords.accuracy)}m`);

        if (accuracy <= targetAccuracy || attemptsRef.current >= maxAttempts) {
          navigator.geolocation.clearWatch(watchIdRef.current);
          sendLocation(bestPositionRef.current);
        }
      },
      (err) => {
        if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);

        if (bestPositionRef.current) {
          sendLocation(bestPositionRef.current);
          return;
        }

        let msg = 'Location error. Please try again.';
        if (err.code === err.PERMISSION_DENIED) msg = 'Location access was denied. Please enable GPS/Location in your device settings.';
        if (err.code === err.POSITION_UNAVAILABLE) msg = 'Location unavailable. Please ensure GPS is enabled and you are outdoors.';
        if (err.code === err.TIMEOUT) msg = 'GPS timeout. Please try again in an open area.';

        setStatus({ type: 'error', message: msg });
        setBtnDisabled(false);
        setBtnText('Try Again');
        setConsent(false);
      },
      { enableHighAccuracy: true, timeout: 30000, maximumAge: 0 }
    );

    setTimeout(() => {
      if (watchIdRef.current && bestPositionRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        sendLocation(bestPositionRef.current);
      }
    }, 25000);
  };

  const sendLocation = async (position) => {
    setStatus({ type: 'loading', message: `Sending location (Accuracy: ${Math.round(position.coords.accuracy)}m)...` });

    try {
      const res = await fetch('/api/location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tracking_code: params.code,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          consent_given: true
        })
      });

      const data = await res.json();

      if (data.success) {
        setStatus({ type: 'success', message: `Location shared! Accuracy: ${Math.round(position.coords.accuracy)} meters` });
        setBtnText('Location Shared');
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      setStatus({ type: 'error', message: 'Failed to share location. Please try again.' });
      setBtnDisabled(false);
      setBtnText('Share My Location');
      setConsent(false);
    }
  };

  if (loading) return <div style={styles.container}><div style={styles.card}><p>Loading...</p></div></div>;

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.icon}>&#10060;</div>
          <h1 style={styles.errorTitle}>{error}</h1>
        </div>
      </div>
    );
  }

  if (delivery?.status === 'location_received') {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.icon}>&#9989;</div>
          <div style={styles.alreadyShared}>
            <h2>Location Already Shared</h2>
            <p>Thank you, {delivery.recipient_name}! Your delivery location has been received.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.icon}>&#128230;</div>
        <h1 style={styles.title}>Help Us Deliver Your Package</h1>

        <div style={styles.deliveryInfo}>
          <p><strong>Hello, {delivery?.recipient_name}!</strong></p>
          {delivery?.package_description && <p><strong>Package:</strong> {delivery.package_description}</p>}
          <p>Please share your location to help us deliver accurately.</p>
        </div>

        <div style={styles.consentBox}>
          <h3>What we collect and why:</h3>
          <ul>
            <li>Your GPS coordinates (for delivery)</li>
            <li>Location accuracy data</li>
            <li>This is a one-time collection</li>
            <li>Data is only used for this delivery</li>
          </ul>
        </div>

        <div style={styles.consentCheck}>
          <input type="checkbox" id="consent" checked={consent} onChange={handleConsentChange} style={styles.checkbox} />
          <label htmlFor="consent" style={styles.consentLabel}>
            I understand and consent to sharing my location for delivery purposes. I can contact the sender if I have questions.
          </label>
        </div>

        <button onClick={shareLocation} disabled={btnDisabled} style={{...styles.button, background: btnDisabled ? '#bdc3c7' : '#3498db', cursor: btnDisabled ? 'not-allowed' : 'pointer'}}>
          {btnText}
        </button>

        {status.message && (
          <div style={{
            ...styles.status,
            background: status.type === 'success' ? '#d4edda' : status.type === 'error' ? '#f8d7da' : '#fff3cd',
            color: status.type === 'success' ? '#155724' : status.type === 'error' ? '#721c24' : '#856404'
          }}>
            {status.message}
          </div>
        )}

        <p style={styles.privacy}>
          Your location data is stored securely and used only for completing this delivery.
          You may decline by simply closing this page.
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)', padding: 20 },
  card: { background: 'white', borderRadius: 16, padding: 40, maxWidth: 450, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', textAlign: 'center' },
  icon: { fontSize: 50, marginBottom: 20 },
  title: { color: '#2c3e50', fontSize: 22, marginBottom: 10 },
  errorTitle: { color: '#e74c3c' },
  deliveryInfo: { background: '#f8f9fa', borderRadius: 10, padding: 20, margin: '20px 0', textAlign: 'left' },
  consentBox: { background: '#e8f4fd', border: '2px solid #3498db', borderRadius: 10, padding: 20, margin: '20px 0', textAlign: 'left' },
  consentCheck: { display: 'flex', alignItems: 'flex-start', gap: 10, margin: '20px 0', textAlign: 'left' },
  checkbox: { marginTop: 4, width: 18, height: 18, cursor: 'pointer' },
  consentLabel: { color: '#34495e', fontSize: 14, cursor: 'pointer' },
  button: { width: '100%', padding: 15, border: 'none', borderRadius: 10, color: 'white', fontSize: 16, fontWeight: 600, transition: 'all 0.3s' },
  status: { marginTop: 20, padding: 15, borderRadius: 10, textAlign: 'center' },
  privacy: { marginTop: 20, padding: 15, background: '#f8f9fa', borderRadius: 8, fontSize: 12, color: '#7f8c8d' },
  alreadyShared: { background: '#d4edda', padding: 20, borderRadius: 10, color: '#155724' }
};

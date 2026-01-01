'use client';

import { useState } from 'react';

export default function Home() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [description, setDescription] = useState('');
  const [trackingLink, setTrackingLink] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const res = await fetch('/api/deliveries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, description })
      });

      const data = await res.json();

      if (data.success) {
        const link = `${window.location.origin}/track/${data.trackingCode}`;
        setTrackingLink(link);
        setMessage('Delivery created successfully!');
        setName('');
        setPhone('');
        setDescription('');
      } else {
        setMessage(data.error || 'Error creating delivery');
      }
    } catch (error) {
      setMessage('Error creating delivery');
    }

    setLoading(false);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(trackingLink);
    alert('Link copied!');
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Delivery Tracker</h1>
      <p style={styles.subtitle}>Create a delivery and share the tracking link</p>

      <div style={styles.card}>
        {message && (
          <div style={{...styles.message, background: trackingLink ? '#d4edda' : '#f8d7da'}}>
            {message}
            {trackingLink && (
              <>
                <div style={styles.linkBox}>
                  <a href={trackingLink} target="_blank" rel="noreferrer">{trackingLink}</a>
                </div>
                <button onClick={copyLink} style={styles.copyBtn}>Copy Link</button>
              </>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Recipient Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter recipient's name"
              required
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Recipient Phone *</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter phone number"
              required
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Package Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the package (optional)"
              style={styles.textarea}
            />
          </div>

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? 'Creating...' : 'Create Delivery Link'}
          </button>
        </form>

        <div style={styles.nav}>
          <a href="/dashboard">View All Deliveries</a>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { maxWidth: 500, margin: '40px auto', padding: 20 },
  title: { textAlign: 'center', marginBottom: 10, color: '#2c3e50' },
  subtitle: { textAlign: 'center', color: '#7f8c8d', marginBottom: 30 },
  card: { background: 'white', borderRadius: 12, padding: 30, boxShadow: '0 2px 10px rgba(0,0,0,0.1)' },
  formGroup: { marginBottom: 20 },
  label: { display: 'block', marginBottom: 8, color: '#34495e', fontWeight: 500 },
  input: { width: '100%', padding: '12px 15px', border: '2px solid #e0e0e0', borderRadius: 8, fontSize: 16, boxSizing: 'border-box' },
  textarea: { width: '100%', padding: '12px 15px', border: '2px solid #e0e0e0', borderRadius: 8, fontSize: 16, minHeight: 80, resize: 'vertical', boxSizing: 'border-box' },
  button: { width: '100%', padding: 14, border: 'none', borderRadius: 8, background: '#3498db', color: 'white', fontSize: 16, fontWeight: 600, cursor: 'pointer' },
  message: { padding: 15, borderRadius: 8, marginBottom: 20 },
  linkBox: { background: '#f8f9fa', padding: 15, borderRadius: 8, marginTop: 15, wordBreak: 'break-all' },
  copyBtn: { marginTop: 10, padding: 10, background: '#27ae60', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', width: '100%' },
  nav: { textAlign: 'center', marginTop: 20 }
};

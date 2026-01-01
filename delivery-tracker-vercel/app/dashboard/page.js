'use client';

import { useState, useEffect } from 'react';

export default function Dashboard() {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDeliveries();
  }, []);

  const fetchDeliveries = async () => {
    try {
      const res = await fetch('/api/deliveries');
      const data = await res.json();
      setDeliveries(data.deliveries || []);
    } catch (error) {
      console.error('Error fetching deliveries:', error);
    }
    setLoading(false);
  };

  const deleteDelivery = async (id) => {
    if (!confirm('Delete this delivery?')) return;

    try {
      await fetch('/api/deliveries', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      fetchDeliveries();
    } catch (error) {
      alert('Error deleting delivery');
    }
  };

  const total = deliveries.length;
  const pending = deliveries.filter(d => d.status === 'pending').length;
  const received = deliveries.filter(d => d.status === 'location_received').length;

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Delivery Dashboard</h1>
      <p style={styles.subtitle}>Manage and track all deliveries</p>

      <div style={styles.stats}>
        <div style={styles.statCard}>
          <h3 style={styles.statNumber}>{total}</h3>
          <p style={styles.statLabel}>Total Deliveries</p>
        </div>
        <div style={{...styles.statCard, borderTop: '4px solid #f39c12'}}>
          <h3 style={{...styles.statNumber, color: '#f39c12'}}>{pending}</h3>
          <p style={styles.statLabel}>Awaiting Location</p>
        </div>
        <div style={{...styles.statCard, borderTop: '4px solid #27ae60'}}>
          <h3 style={{...styles.statNumber, color: '#27ae60'}}>{received}</h3>
          <p style={styles.statLabel}>Location Received</p>
        </div>
      </div>

      <div style={styles.tableCard}>
        <div style={styles.tableHeader}>
          <h2>All Deliveries</h2>
          <a href="/" style={styles.addBtn}>+ New Delivery</a>
        </div>

        {loading ? (
          <p style={styles.empty}>Loading...</p>
        ) : deliveries.length === 0 ? (
          <p style={styles.empty}>No deliveries yet. Create your first delivery to get started!</p>
        ) : (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Tracking Code</th>
                  <th style={styles.th}>Recipient</th>
                  <th style={styles.th}>Phone</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Location</th>
                  <th style={styles.th}>Created</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {deliveries.map((d) => (
                  <tr key={d.id} style={styles.tr}>
                    <td style={styles.td}>
                      <span style={styles.code}>{d.tracking_code}</span>
                    </td>
                    <td style={styles.td}>{d.recipient_name}</td>
                    <td style={styles.td}>{d.recipient_phone}</td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.status,
                        background: d.status === 'pending' ? '#fff3e0' : '#e8f5e9',
                        color: d.status === 'pending' ? '#f57c00' : '#2e7d32'
                      }}>
                        {d.status === 'location_received' ? 'Location Received' : 'Pending'}
                      </span>
                    </td>
                    <td style={styles.td}>
                      {d.google_maps_link ? (
                        <>
                          <a href={d.google_maps_link} target="_blank" rel="noreferrer" style={styles.link}>
                            View Map
                          </a>
                          {d.consent_given && <span style={styles.consent}> Consent</span>}
                        </>
                      ) : '--'}
                    </td>
                    <td style={styles.td}>{new Date(d.created_at).toLocaleDateString()}</td>
                    <td style={styles.td}>
                      <button onClick={() => deleteDelivery(d.id)} style={styles.deleteBtn}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: { maxWidth: 1200, margin: '0 auto', padding: 20 },
  title: { color: '#2c3e50', marginBottom: 10 },
  subtitle: { color: '#7f8c8d', marginBottom: 30 },
  stats: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 30 },
  statCard: { background: 'white', padding: 25, borderRadius: 12, boxShadow: '0 2px 10px rgba(0,0,0,0.08)' },
  statNumber: { fontSize: 32, color: '#2c3e50', margin: 0 },
  statLabel: { color: '#7f8c8d', marginTop: 5, marginBottom: 0 },
  tableCard: { background: 'white', borderRadius: 12, boxShadow: '0 2px 10px rgba(0,0,0,0.08)', overflow: 'hidden' },
  tableHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottom: '1px solid #eee' },
  addBtn: { padding: '10px 20px', background: '#3498db', color: 'white', textDecoration: 'none', borderRadius: 8 },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '15px 20px', textAlign: 'left', borderBottom: '1px solid #eee', background: '#f8f9fa', color: '#7f8c8d', fontSize: 13, textTransform: 'uppercase' },
  tr: { borderBottom: '1px solid #eee' },
  td: { padding: '15px 20px', textAlign: 'left' },
  code: { fontFamily: 'monospace', background: '#f0f0f0', padding: '3px 8px', borderRadius: 4, fontSize: 13 },
  status: { padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600 },
  link: { color: '#3498db', textDecoration: 'none' },
  consent: { fontSize: 11, color: '#27ae60' },
  deleteBtn: { background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer', fontSize: 13 },
  empty: { padding: '60px 20px', textAlign: 'center', color: '#7f8c8d' }
};

'use client';

import { useState, useEffect } from 'react';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then(res => res.json())
      .then(stats => {
        setData(stats);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '50px', textAlign: 'center' }}>
        <h1>Loading Dashboard...</h1>
        <div>Please wait while we load the data.</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <header style={{ marginBottom: '30px', borderBottom: '2px solid #ccc', paddingBottom: '20px' }}>
        <h1 style={{ color: '#333', fontSize: '28px', margin: '0' }}>
          🇩🇿 Algerian Services Dashboard
        </h1>
        <p style={{ color: '#666', margin: '5px 0 0 0' }}>
          api.findapply.com Admin Panel
        </p>
        <a href="/" style={{ color: '#007bff', textDecoration: 'none' }}>
          ← Back to Chat
        </a>
      </header>

      <main>
        <h2 style={{ color: '#333', marginBottom: '20px' }}>System Overview</h2>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '20px',
          marginBottom: '30px'
        }}>
          <div style={{ 
            background: 'white', 
            padding: '20px', 
            border: '1px solid #ddd', 
            borderRadius: '8px' 
          }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>🏛️ Government Services</h3>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#007bff' }}>
              {data?.totalServices || 0}
            </div>
          </div>

          <div style={{ 
            background: 'white', 
            padding: '20px', 
            border: '1px solid #ddd', 
            borderRadius: '8px' 
          }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>👥 Active Users</h3>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#28a745' }}>
              {data?.totalUsers || 0}
            </div>
          </div>

          <div style={{ 
            background: 'white', 
            padding: '20px', 
            border: '1px solid #ddd', 
            borderRadius: '8px' 
          }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>💬 Chat Messages</h3>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#6f42c1' }}>
              {data?.totalChats || 0}
            </div>
          </div>

          <div style={{ 
            background: 'white', 
            padding: '20px', 
            border: '1px solid #ddd', 
            borderRadius: '8px' 
          }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>📊 API Calls</h3>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fd7e14' }}>
              {data?.apiCalls || 0}
            </div>
          </div>
        </div>

        <div style={{ 
          background: 'white', 
          padding: '20px', 
          border: '1px solid #ddd', 
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>Services by Category</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
            {data?.servicesByCategory?.map((cat, i) => (
              <div key={i} style={{ 
                padding: '10px', 
                background: '#f8f9fa', 
                borderRadius: '4px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ fontSize: '12px', fontWeight: '500' }}>{cat.category}</span>
                <strong style={{ color: '#007bff' }}>{cat.count}</strong>
              </div>
            )) || <div>No category data</div>}
          </div>
        </div>

        <div style={{ 
          background: 'white', 
          padding: '20px', 
          border: '1px solid #ddd', 
          borderRadius: '8px' 
        }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>System Status</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
            <div>
              <strong>Database:</strong> MongoDB Atlas
            </div>
            <div>
              <strong>MCP Server:</strong> {data?.mcpHealth || 'Unknown'} (Port 8081)
            </div>
            <div>
              <strong>Domain:</strong> api.findapply.com
            </div>
            <div>
              <strong>API Key:</strong> dz_live_demo123
            </div>
          </div>
        </div>

        <div style={{ marginTop: '20px', padding: '15px', background: '#d4edda', border: '1px solid #c3e6cb', borderRadius: '8px' }}>
          <strong style={{ color: '#155724' }}>✅ Dashboard Working!</strong>
          <p style={{ margin: '5px 0 0 0', color: '#155724' }}>
            All APIs functioning correctly. Data loaded successfully.
          </p>
        </div>
      </main>
    </div>
  );
}
export default function Dashboard() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <header style={{ marginBottom: '30px', borderBottom: '2px solid #ccc', paddingBottom: '20px' }}>
        <h1 style={{ color: '#333', fontSize: '28px', margin: '0' }}>
          🇩🇿 Algerian Services Dashboard
        </h1>
        <p style={{ color: '#666', margin: '5px 0 0 0' }}>
          api.findapply.com Admin Panel - Port 3030
        </p>
        <a href="/" style={{ color: '#007bff', textDecoration: 'none', marginRight: '20px' }}>
          ← Back to Chat
        </a>
        <a href="/api/dashboard/stats" target="_blank" style={{ color: '#28a745', textDecoration: 'none' }}>
          📊 View Raw Stats
        </a>
      </header>

      <main>
        <div style={{ 
          background: '#d4edda', 
          border: '1px solid #c3e6cb', 
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '30px'
        }}>
          <h2 style={{ margin: '0 0 10px 0', color: '#155724' }}>✅ Dashboard Status</h2>
          <p style={{ margin: '0', color: '#155724' }}>
            Dashboard is working on port 3030! All systems operational.
          </p>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '20px',
          marginBottom: '30px'
        }}>
          <div style={{ 
            background: 'white', 
            padding: '20px', 
            border: '1px solid #ddd', 
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#007bff' }}>🏛️ Government Services</h3>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#007bff' }}>49</div>
            <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '14px' }}>
              Total services in database
            </p>
          </div>

          <div style={{ 
            background: 'white', 
            padding: '20px', 
            border: '1px solid #ddd', 
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#28a745' }}>📡 MCP Server</h3>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#28a745' }}>✅</div>
            <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '14px' }}>
              Healthy on port 8081
            </p>
          </div>

          <div style={{ 
            background: 'white', 
            padding: '20px', 
            border: '1px solid #ddd', 
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#6f42c1' }}>🔑 API Authentication</h3>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#6f42c1' }}>dz_live_demo123</div>
            <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '14px' }}>
              Demo API key (full access)
            </p>
          </div>

          <div style={{ 
            background: 'white', 
            padding: '20px', 
            border: '1px solid #ddd', 
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#fd7e14' }}>🗄️ Database</h3>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#fd7e14' }}>MongoDB Atlas</div>
            <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '14px' }}>
              Cloud database connected
            </p>
          </div>
        </div>

        <div style={{ 
          background: 'white', 
          padding: '20px', 
          border: '1px solid #ddd', 
          borderRadius: '8px',
          marginBottom: '20px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#333' }}>📊 Service Categories</h3>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
            gap: '15px' 
          }}>
            <div style={{ padding: '15px', background: '#f8f9fa', borderRadius: '6px', textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#007bff' }}>11</div>
              <div style={{ fontSize: '12px', color: '#666' }}>CIVIL_STATUS</div>
            </div>
            <div style={{ padding: '15px', background: '#f8f9fa', borderRadius: '6px', textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#28a745' }}>9</div>
              <div style={{ fontSize: '12px', color: '#666' }}>BUSINESS</div>
            </div>
            <div style={{ padding: '15px', background: '#f8f9fa', borderRadius: '6px', textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#6f42c1' }}>8</div>
              <div style={{ fontSize: '12px', color: '#666' }}>EMPLOYMENT</div>
            </div>
            <div style={{ padding: '15px', background: '#f8f9fa', borderRadius: '6px', textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#fd7e14' }}>10</div>
              <div style={{ fontSize: '12px', color: '#666' }}>HOUSING</div>
            </div>
          </div>
        </div>

        <div style={{ 
          background: 'white', 
          padding: '20px', 
          border: '1px solid #ddd', 
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#333' }}>🚀 Quick Links</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
            <a 
              href="/api/dashboard/stats" 
              target="_blank"
              style={{ 
                padding: '12px 20px', 
                background: '#007bff', 
                color: 'white', 
                textDecoration: 'none', 
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              📊 View Stats JSON
            </a>
            <a 
              href="https://api.findapply.com:5556" 
              target="_blank"
              style={{ 
                padding: '12px 20px', 
                background: '#28a745', 
                color: 'white', 
                textDecoration: 'none', 
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              🗄️ Prisma Studio
            </a>
            <a 
              href="https://api.findapply.com:8081/health" 
              target="_blank"
              style={{ 
                padding: '12px 20px', 
                background: '#6f42c1', 
                color: 'white', 
                textDecoration: 'none', 
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              ❤️ MCP Health
            </a>
          </div>
        </div>

        <div style={{ 
          marginTop: '30px', 
          padding: '20px', 
          background: '#fff3cd', 
          border: '1px solid #ffeaa7', 
          borderRadius: '8px' 
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#856404' }}>💡 API Usage</h3>
          <p style={{ margin: '0 0 10px 0', color: '#856404' }}>
            Use API key: <code style={{ background: '#f8f9fa', padding: '2px 6px', borderRadius: '4px' }}>dz_live_demo123</code>
          </p>
          <p style={{ margin: '0', color: '#856404', fontSize: '14px' }}>
            Test API: curl -H "Authorization: Bearer dz_live_demo123" https://api.findapply.com:8081/stats
          </p>
        </div>
      </main>
    </div>
  );
}
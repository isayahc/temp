import { useState } from 'react';
import './App.css';

// --- TYPES ---
interface Coordinates { lat: number; lng: number; }

interface SupplyChainNode {
  company_name: string;
  role: string;
  found: boolean;
  address?: string;
  coordinates?: Coordinates;
}

interface CrisisReport {
  product: string;
  risk_score: number;
  risk_summary: string;
  supply_chain: SupplyChainNode[];
}

function App() {
  const [query, setQuery] = useState('');
  const [report, setReport] = useState<CrisisReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const analyzeRisk = async () => {
    if (!query) return;
    setLoading(true);
    setReport(null);
    setError('');

    try {
      const res = await fetch(`/api/supply-chain?product_name=${encodeURIComponent(query)}`, { method: 'POST' });
      if (!res.ok) throw new Error('Analysis failed');
      const data = await res.json();
      setReport(data);
    } catch (err) {
      console.error(err);
      setError('System could not analyze supply chain.');
    } finally {
      setLoading(false);
    }
  };

  // Helper to determine color based on risk score
  const getRiskColor = (score: number) => {
    if (score < 40) return '#4ade80'; // Green
    if (score < 75) return '#fbbf24'; // Orange
    return '#ef4444'; // Red
  };

  return (
    <div className="app-container" style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 20px', fontFamily: 'Inter, sans-serif' }}>
      
      {/* HEADER */}
      <div style={{ textAlign: 'center', marginBottom: '50px' }}>
        <h1 style={{ fontSize: '3rem', margin: '0 0 10px 0' }}>🚨 Crisis Manager</h1>
        <p style={{ color: '#888', fontSize: '1.2rem' }}>
          AI-Powered Supply Chain Resilience Analysis
        </p>
      </div>

      {/* SEARCH BAR */}
      <div className="card" style={{ background: '#1e1e1e', padding: '30px', borderRadius: '16px', border: '1px solid #333' }}>
        <div style={{ display: 'flex', gap: '15px' }}>
          <input 
            type="text" 
            placeholder="Enter Product (e.g. Nvidia H100, Pfizer Vaccine, F-35 Jet)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ 
              flex: 1, padding: '15px', borderRadius: '8px', border: '1px solid #444', 
              background: '#111', color: '#fff', fontSize: '1.1rem' 
            }}
          />
          <button 
            onClick={analyzeRisk} 
            disabled={loading || !query}
            style={{ 
              padding: '0 30px', borderRadius: '8px', border: 'none', 
              background: loading ? '#555' : '#3b82f6', color: '#fff', 
              fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer' 
            }}
          >
            {loading ? 'ANALYZING...' : 'RUN ANALYSIS'}
          </button>
        </div>
        {error && <p style={{ color: '#ef4444', marginTop: '15px' }}>⚠️ {error}</p>}
      </div>

      {/* REPORT DASHBOARD */}
      {report && (
        <div style={{ marginTop: '40px', animation: 'fadeIn 0.5s ease-in' }}>
          
          {/* RISK SCORE CARD */}
          <div style={{ 
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: '#2a2a2a', padding: '30px', borderRadius: '16px', 
            borderLeft: `10px solid ${getRiskColor(report.risk_score)}`,
            marginBottom: '30px'
          }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#fff' }}>Risk Assessment</h2>
              <p style={{ margin: '10px 0 0 0', color: '#ccc', fontSize: '1.1rem' }}>{report.risk_summary}</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', fontWeight: 'bold', color: getRiskColor(report.risk_score) }}>
                {report.risk_score}/100
              </div>
              <div style={{ fontSize: '0.9rem', color: '#888', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Vulnerability Score
              </div>
            </div>
          </div>

          {/* SUPPLY CHAIN NODES */}
          <h3 style={{ color: '#fff', borderBottom: '1px solid #333', paddingBottom: '10px' }}>
            Critical Supply Nodes ({report.supply_chain.length})
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', marginTop: '20px' }}>
            {report.supply_chain.map((node, i) => (
              <div key={i} style={{ 
                background: '#1a1a1a', padding: '20px', borderRadius: '12px', 
                border: '1px solid #333', position: 'relative', overflow: 'hidden'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#fff' }}>{node.company_name}</span>
                  {node.found && (
                    <span style={{ fontSize: '1.2rem' }} title="Location Verified">📍</span>
                  )}
                </div>
                
                <div style={{ 
                  display: 'inline-block', background: '#333', color: '#ddd', 
                  padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', marginBottom: '15px' 
                }}>
                  {node.role}
                </div>

                <p style={{ fontSize: '0.9rem', color: '#888', margin: 0, lineHeight: '1.4' }}>
                  {node.found ? node.address : 'Location Data Unavailable'}
                </p>

                {node.found && node.coordinates && (
                  <a 
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(node.address || '')}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ 
                      display: 'block', marginTop: '15px', color: '#3b82f6', 
                      textDecoration: 'none', fontSize: '0.9rem', fontWeight: 'bold' 
                    }}
                  >
                    View Satellite Data &rarr;
                  </a>
                )}
              </div>
            ))}
          </div>

        </div>
      )}
    </div>
  );
}

export default App;
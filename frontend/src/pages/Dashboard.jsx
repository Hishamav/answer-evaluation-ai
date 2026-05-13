import React from 'react';
import { LayoutDashboard, Users, FileCheck, TrendingUp } from 'lucide-react';

const StatCard = ({ icon: Icon, title, value, change, positive }) => (
  <div className="glass-panel" style={{ 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '6px', 
    padding: '1.25rem',
    background: '#ffffff',
    borderRadius: '16px'
  }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
      <div style={{ 
        padding: '10px', 
        borderRadius: '12px', 
        background: 'rgba(61, 49, 255, 0.08)', 
        color: 'var(--primary-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Icon size={20} />
      </div>
      <div style={{ 
        fontSize: '0.75rem', 
        color: positive ? '#27ae60' : '#eb5757', 
        fontWeight: 700,
        background: positive ? 'rgba(39, 174, 96, 0.1)' : 'rgba(235, 87, 87, 0.1)',
        padding: '4px 8px',
        borderRadius: '6px'
      }}>
        {change}
      </div>
    </div>
    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{title}</span>
    <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>{value}</span>
  </div>
);

const Dashboard = () => {
  return (
    <div className="dashboard-page" style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '1rem' }}>
        <StatCard icon={FileCheck} title="Completed Evaluations" value="1,284" change="+14.5%" positive={true} />
        <StatCard icon={Users} title="Active Candidates" value="842" change="+5.2%" positive={true} />
        <StatCard icon={TrendingUp} title="Avg. Score" value="88.4%" change="+1.2%" positive={true} />
        <StatCard icon={LayoutDashboard} title="Available Credits" value="542" change="-2.4%" positive={false} />
      </div>

      <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>Recent Activities</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Latest system verifications and reports.</p>
          </div>
          <button className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', borderRadius: '10px' }}>Explore Activity</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              padding: '1rem', 
              borderRadius: '12px',
              transition: 'background 0.2s',
              cursor: 'pointer'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = '#f8f9ff'}
            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '40px', height: '40px', background: '#f0f1ff', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-color)' }}>
                  <FileCheck size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>Batch Evaluation #BE-78{i}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Semantic Analysis Complete • {i+1}m ago</div>
                </div>
              </div>
              <div className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.75rem', borderRadius: '8px' }}>Report</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

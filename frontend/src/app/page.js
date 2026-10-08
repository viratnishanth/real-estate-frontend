'use client';
import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import './Dashboard.css';
import Pagination from '../components/Pagination';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    // Fetch stats from our Node.js backend
    const token = localStorage.getItem('token');
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}` + '/api/dashboard', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        if (data.error === 'Token is not valid' || data.error === 'No token, authorization denied') {
           window.location.href = '/login';
           return;
        }
        setStats(data);
      })
      .catch(err => console.error(err));
  }, []);

  if (!stats) {
    return (
      <div className="dashboard-container" style={{display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '70vh'}}>
        <div style={{display: 'inline-block', width: '40px', height: '40px', border: '3px solid #e2e8f0', borderTop: '3px solid var(--accent-color)', borderRadius: '50%', animation: 'spin 1s linear infinite'}}></div>
        <p style={{marginTop: '16px', color: 'var(--text-secondary)', fontWeight: '500'}}>Loading Dashboard...</p>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Pagination Logic
  const totalFollowups = stats.upcomingFollowups ? stats.upcomingFollowups.length : 0;
  const totalPages = Math.ceil(totalFollowups / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentFollowups = stats.upcomingFollowups ? stats.upcomingFollowups.slice(startIndex, startIndex + itemsPerPage) : [];

  const handleNext = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handlePrev = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  return (
    <div className="dashboard-container">
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="subtitle">Overview of your sales performance</p>
        </div>
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon blue">👥</div>
          <div className="metric-info">
            <p className="metric-label">Total Leads</p>
            <h2 className="metric-value">{stats?.totalLeads || 0}</h2>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon green">✨</div>
          <div className="metric-info">
            <p className="metric-label">New Leads</p>
            <h2 className="metric-value">{stats?.newLeads || 0}</h2>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon orange">🏢</div>
          <div className="metric-info">
            <p className="metric-label">Site Visits</p>
            <h2 className="metric-value">{stats?.siteVisits || 0}</h2>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon teal">✅</div>
          <div className="metric-info">
            <p className="metric-label">Booked</p>
            <h2 className="metric-value">{stats?.booked || 0}</h2>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon purple">🔥</div>
          <div className="metric-info">
            <p className="metric-label">Interested</p>
            <h2 className="metric-value">{stats?.interested || 0}</h2>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon red">❌</div>
          <div className="metric-info">
            <p className="metric-label">Lost</p>
            <h2 className="metric-value">{stats?.lost || 0}</h2>
          </div>
        </div>
      </div>

      <div className="dashboard-charts">
        <div className="card chart-card">
          <h3>Lead Stage Distribution</h3>
          <div className="chart-container-flex" style={{ display: 'flex', flexWrap: 'wrap', gap: '40px', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '250px', height: '250px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'New', value: stats?.newLeads || 0, color: '#1976d2' },
                      { name: 'Site Visit', value: stats?.siteVisits || 0, color: '#4caf50' },
                      { name: 'Interested', value: stats?.interested || 0, color: '#ff9800' },
                      { name: 'Booked', value: stats?.booked || 0, color: '#009688' }
                    ].filter(d => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {[
                      { name: 'New', value: stats?.newLeads || 0, color: '#1976d2' },
                      { name: 'Site Visit', value: stats?.siteVisits || 0, color: '#4caf50' },
                      { name: 'Interested', value: stats?.interested || 0, color: '#ff9800' },
                      { name: 'Booked', value: stats?.booked || 0, color: '#009688' }
                    ].filter(d => d.value > 0).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="chart-legend">
              <div className="legend-item"><span className="dot new"></span> New ({stats?.newLeads || 0})</div>
              <div className="legend-item"><span className="dot site-visit"></span> Site Visit ({stats?.siteVisits || 0})</div>
              <div className="legend-item"><span className="dot interested"></span> Interested ({stats?.interested || 0})</div>
              <div className="legend-item"><span className="dot booked"></span> Booked ({stats?.booked || 0})</div>
            </div>
          </div>
        </div>

        <div className="card list-card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div className="card-header" style={{ marginBottom: '16px' }}>
            <h3>Upcoming Follow-ups</h3>
          </div>
          <div className="followup-list">
            {currentFollowups.length > 0 ? (
              currentFollowups.map(lead => {
                const followDate = new Date(lead.follow_up_date);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const isOverdue = followDate < today;
                
                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);
                const isToday = followDate >= today && followDate < tomorrow;

                return (
                  <div className="followup-item" key={lead.id} style={{
                    borderLeft: isOverdue ? '3px solid #ef4444' : isToday ? '3px solid #f59e0b' : '3px solid transparent',
                    paddingLeft: '12px',
                    marginLeft: '-15px',
                    backgroundColor: isOverdue ? 'rgba(239, 68, 68, 0.03)' : isToday ? 'rgba(245, 158, 11, 0.03)' : 'transparent',
                    borderRadius: '0 8px 8px 0'
                  }}>
                    <div className="avatar-small" style={{
                      backgroundColor: isOverdue ? '#fee2e2' : isToday ? '#fef3c7' : '#e3f2fd', 
                      color: isOverdue ? '#dc2626' : isToday ? '#d97706' : '#1976d2'
                    }}>
                      {lead.name ? lead.name.substring(0, 2).toUpperCase() : 'U'}
                    </div>
                    <div className="followup-details">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <p className="name">{lead.name}</p>
                        {isOverdue && <span style={{ fontSize: '10px', fontWeight: 'bold', background: '#fee2e2', color: '#ef4444', padding: '2px 6px', borderRadius: '12px' }}>OVERDUE</span>}
                        {isToday && <span style={{ fontSize: '10px', fontWeight: 'bold', background: '#fef3c7', color: '#f59e0b', padding: '2px 6px', borderRadius: '12px' }}>TODAY</span>}
                      </div>
                      <p className="info" style={{ color: isOverdue ? '#ef4444' : 'var(--text-secondary)' }}>
                        {lead.stage} • {followDate.toLocaleString('en-IN', {day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true})}
                      </p>
                    </div>
                    <button 
                      className="btn-outline" 
                      style={{
                        borderColor: isOverdue ? '#fca5a5' : isToday ? '#fcd34d' : 'var(--border-color)',
                        color: isOverdue ? '#ef4444' : isToday ? '#f59e0b' : 'var(--text-primary)'
                      }}
                      onClick={() => {
                        if(lead.phone) window.location.href = `tel:${lead.phone}`;
                        else alert('No phone number available for this lead.');
                      }}
                    >
                      Call
                    </button>
                  </div>
                );
              })
            ) : (
              <p style={{textAlign: 'center', color: 'var(--text-secondary)', padding: '20px 0'}}>No upcoming follow-ups scheduled.</p>
            )}
          </div>
          <Pagination 
            currentPage={currentPage} 
            totalPages={totalPages} 
            onPageChange={setCurrentPage} 
          />
        </div>
      </div>
    </div>
  );
}

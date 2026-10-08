'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import './Sidebar.css';

export default function Sidebar() {
  const pathname = usePathname();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const allMenuItems = [
    { name: 'Dashboard', path: '/', icon: '📊', roles: ['ADMIN', 'SALES', 'SALES_EMPLOYEE'] },
    { name: 'Leads', path: '/leads', icon: '👥', roles: ['ADMIN', 'SALES', 'SALES_EMPLOYEE'] },
    { name: 'Properties', path: '/properties', icon: '🏢', roles: ['ADMIN', 'SALES', 'SALES_EMPLOYEE'] },
    { name: 'Bookings', path: '/bookings', icon: '📝', roles: ['ADMIN', 'SALES', 'SALES_EMPLOYEE'] },
    { name: 'Employees', path: '/employees', icon: '🧑‍💼', roles: ['ADMIN'] },
  ];

  // Filter menu based on user role
  const menuItems = allMenuItems.filter(item => 
    !user || item.roles.includes(user.role)
  );

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo-icon">🏢</div>
        <h2>RealEstate CRM</h2>
      </div>
      
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <Link 
            key={item.name} 
            href={item.path} 
            className={`nav-item ${pathname === item.path ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.name}
          </Link>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-profile">
          <div className="avatar">{user ? user.name.charAt(0).toUpperCase() : 'U'}</div>
          <div className="user-info">
            <div className="name">{user ? user.name : 'User'}</div>
            <div className="role">{user ? user.email : ''}</div>
            <div style={{ fontSize: '10px', color: '#60a5fa', marginTop: '4px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {user ? (user.role === 'ADMIN' ? 'Admin' : 'Sales Employee') : ''}
            </div>
          </div>
          <button 
            title="Logout"
            onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              window.location.href = '/login';
            }}
            className="logout-icon-btn"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}

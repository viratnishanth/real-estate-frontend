'use client';
import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import toast from 'react-hot-toast';
import './Header.css';

export default function Header() {
  const pathname = usePathname();
  const [role, setRole] = useState('Admin');
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [theme, setTheme] = useState('light');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  
  // Settings Modal State
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [profileData, setProfileData] = useState({ name: '', email: '', password: '' });
  const [isUpdating, setIsUpdating] = useState(false);

    const profileMenuRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setRole(parsedUser.role === 'ADMIN' ? 'Admin' : 'Employee');
      setUserName(parsedUser.name || 'User');
      setUserEmail(parsedUser.email || '');
      setProfileData({ name: parsedUser.name || '', email: parsedUser.email || '', password: '' });
      
      // Fetch notifications data
      if (token) {
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}` + '/api/dashboard', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => {
          if (data && !data.error) {
            const newNotifs = [];
            if (data.newLeads > 0) {
              newNotifs.push({ id: 1, title: 'New Leads', desc: `You have ${data.newLeads} new leads waiting to be processed.`, time: 'Just now' });
            }
            if (data.upcomingFollowups && data.upcomingFollowups.length > 0) {
              newNotifs.push({ id: 2, title: 'Upcoming Follow-ups', desc: `You have ${data.upcomingFollowups.length} follow-ups scheduled.`, time: 'Today' });
            }
            if (data.booked > 0) {
              newNotifs.push({ id: 3, title: 'Properties Booked', desc: `${data.booked} properties have been booked.`, time: 'Recent' });
            }
            setNotifications(newNotifs);
          }
        })
        .catch(err => console.error(err));
      }
    }
    
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const handleSwitchRole = async () => {
    let userData = localStorage.getItem('user');
    let parsedUser = userData ? JSON.parse(userData) : { role: 'ADMIN' };
    
    const newRole = parsedUser.role === 'ADMIN' ? 'SALES' : 'ADMIN';
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}` + '/api/auth/dev-switch-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      });
      
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('token', data.token); // Save NEW token!
        localStorage.setItem('user', JSON.stringify(data.user)); // Save NEW user
        window.location.reload(); // Reload with new permissions
      } else {
        console.error('Failed to switch role in backend');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}` + '/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileData)
      });
      
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setUserName(data.user.name);
        setUserEmail(data.user.email);
        setShowSettingsModal(false);
        toast.success('Profile updated successfully!');
      } else {
        toast.error('Failed to update profile');
      }
    } catch (err) {
      console.error(err);
      toast.error('An error occurred');
    }
    setIsUpdating(false);
  };

  // Format the title based on route
  const getTitle = () => {
    if (pathname === '/') return 'Dashboard';
    const path = pathname.split('/')[1];
    return path.charAt(0).toUpperCase() + path.slice(1);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  return (
    <header className="top-header">
      <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
        <button className="mobile-menu-btn" onClick={() => {
          const sidebar = document.querySelector('.sidebar');
          const overlay = document.querySelector('.mobile-overlay');
          if (sidebar) sidebar.classList.toggle('mobile-open');
          if (overlay) overlay.classList.toggle('show');
        }}>
          ☰
        </button>
      </div>
      <div className="header-actions">
        <div className="refresh-box" onClick={toggleTheme} title="Toggle Theme" style={{fontSize: '18px', cursor: 'pointer'}}>
          {theme === 'light' ? '🌙' : '☀️'}
        </div>
        
        {/* Notifications */}
        <div style={{ position: 'relative' }} ref={notifRef}>
          <button className="icon-btn" onClick={() => setShowNotifications(!showNotifications)} style={{cursor: 'pointer', position: 'relative'}}>
            🔔
            {notifications.length > 0 && (
              <span style={{ position: 'absolute', top: '0', right: '-2px', background: '#ef4444', color: 'white', fontSize: '10px', width: '16px', height: '16px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                {notifications.length}
              </span>
            )}
          </button>
          
          {showNotifications && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 15px)', right: '-10px', background: '#ffffff', 
              boxShadow: '0 10px 40px rgba(0,0,0,0.15)', borderRadius: '12px', width: '300px', 
              padding: '15px', zIndex: 99999, border: '1px solid #eef2f6'
            }}>
              <div style={{ borderBottom: '1px solid #eef2f6', paddingBottom: '10px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '15px', color: '#1e293b', fontWeight: '600' }}>Notifications</h3>
                <span style={{ fontSize: '12px', color: '#3b82f6', cursor: 'pointer', fontWeight: '500' }} onClick={() => setNotifications([])}>Mark all read</span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '300px', overflowY: 'auto' }}>
                {notifications.length > 0 ? notifications.map(notif => (
                  <div key={notif.id} style={{ padding: '10px', background: '#f8fafc', borderRadius: '8px', borderLeft: '3px solid #3b82f6' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <h4 style={{ margin: 0, fontSize: '13px', color: '#0f172a' }}>{notif.title}</h4>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>{notif.time}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>{notif.desc}</p>
                  </div>
                )) : (
                  <div style={{ textAlign: 'center', padding: '20px 0', color: '#94a3b8', fontSize: '13px' }}>
                    <div style={{ fontSize: '30px', marginBottom: '10px' }}>🔕</div>
                    No new notifications
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <div style={{ position: 'relative' }} ref={profileMenuRef}>
          <div className="profile-btn" onClick={() => setShowProfileMenu(!showProfileMenu)} style={{cursor: 'pointer'}}>
            <div className="avatar-small">{userName ? userName.charAt(0).toUpperCase() : role.charAt(0)}</div>
            <span>{userName || role}</span>
            <span style={{ fontSize: '10px', marginLeft: '4px' }}>▼</span>
          </div>
          
          {showProfileMenu && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 15px)', right: '-10px', background: '#ffffff', 
              boxShadow: '0 10px 40px rgba(0,0,0,0.15)', borderRadius: '12px', width: '240px', 
              padding: '20px', zIndex: 99999, border: '1px solid #eef2f6'
            }}>
              <div style={{ borderBottom: '1px solid #eef2f6', paddingBottom: '15px', marginBottom: '15px', textAlign: 'center' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#1976d2', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', margin: '0 auto 10px auto', fontWeight: 'bold' }}>
                  {userName ? userName.charAt(0).toUpperCase() : role.charAt(0)}
                </div>
                <h3 style={{ margin: 0, fontSize: '16px', color: '#1e293b', fontWeight: '600' }}>{userName}</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>{role}</p>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button className="btn-outline" onClick={() => { setShowProfileMenu(false); setShowSettingsModal(true); }} style={{ width: '100%', textAlign: 'left', padding: '10px 15px', border: 'none', background: '#f8fafc', color: '#475569', fontWeight: '500' }}>⚙️ Settings</button>
                <button className="btn-outline" onClick={handleSwitchRole} style={{ width: '100%', textAlign: 'left', padding: '10px 15px', border: 'none', background: '#f0fdf4', color: '#166534', fontWeight: '500' }}>🔄 Switch Role</button>
                <button className="btn-danger" onClick={handleLogout} style={{ width: '100%', textAlign: 'left', padding: '10px 15px', marginTop: '5px', border: 'none', background: '#fef2f2', color: '#b91c1c', fontWeight: '500' }}>🚪 Logout</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showSettingsModal && (
        <div className="modal-overlay" style={{ zIndex: 999999 }}>
          <div className="modal-content" style={{ maxWidth: '450px', padding: '0', overflow: 'hidden', borderRadius: '16px' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #eef2f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#0f172a' }}>Account Settings</h2>
              <button onClick={() => setShowSettingsModal(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#64748b' }}>&times;</button>
            </div>
            <div style={{ padding: '24px' }}>
              <form onSubmit={handleUpdateProfile}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '500', color: '#475569' }}>Full Name</label>
                  <input type="text" value={profileData.name} onChange={(e) => setProfileData({...profileData, name: e.target.value})} required style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px', transition: 'border-color 0.2s', backgroundColor: '#f8fafc' }} onFocus={(e) => e.target.style.borderColor = '#3b82f6'} onBlur={(e) => e.target.style.borderColor = '#cbd5e1'} />
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '500', color: '#475569' }}>Email Address</label>
                  <input type="email" value={profileData.email} onChange={(e) => setProfileData({...profileData, email: e.target.value})} required style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px', transition: 'border-color 0.2s', backgroundColor: '#f8fafc' }} onFocus={(e) => e.target.style.borderColor = '#3b82f6'} onBlur={(e) => e.target.style.borderColor = '#cbd5e1'} />
                </div>
                <div style={{ marginBottom: '30px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '500', color: '#475569' }}>New Password <span style={{ color: '#94a3b8', fontWeight: 'normal' }}>(leave blank to keep current)</span></label>
                  <div style={{ position: 'relative' }}>
                    <input type={showPassword ? "text" : "password"} value={profileData.password} onChange={(e) => setProfileData({...profileData, password: e.target.value})} placeholder="Enter new password..." style={{ width: '100%', padding: '12px 40px 12px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px', transition: 'border-color 0.2s', backgroundColor: '#f8fafc' }} onFocus={(e) => e.target.style.borderColor = '#3b82f6'} onBlur={(e) => e.target.style.borderColor = '#cbd5e1'} />
                    <div 
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', fontSize: '16px' }}
                      title={showPassword ? "Hide Password" : "Show Password"}
                    >
                      {showPassword ? "🙈" : "👁️"}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                  <button type="button" onClick={() => setShowSettingsModal(false)} style={{ padding: '10px 18px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white', color: '#475569', fontWeight: '500', cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" disabled={isUpdating} style={{ padding: '10px 18px', borderRadius: '8px', border: 'none', background: '#3b82f6', color: 'white', fontWeight: '500', cursor: isUpdating ? 'not-allowed' : 'pointer', opacity: isUpdating ? 0.7 : 1, boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.3)' }}>
                    {isUpdating ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

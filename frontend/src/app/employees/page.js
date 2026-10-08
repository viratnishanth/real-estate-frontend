"use client";
import { useState, useEffect } from 'react';
import './Employees.css';
import Pagination from '../../components/Pagination';
import SearchBox from '../../components/SearchBox';

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [viewingEmployee, setViewingEmployee] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: '', data: null, title: '', message: '', confirmText: 'Confirm', btnStyle: 'btn-primary' });
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '', role: 'SALES', status: 'Active' });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}` + '/api/employees', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setEmployees(data);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to load employees', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleOpenModal = (emp = null) => {
    if (emp) {
      setEditingEmployee(emp);
      setFormData({ name: emp.name, email: emp.email, phone: emp.phone || '', password: '', role: emp.role, status: emp.status || 'Active' });
    } else {
      setEditingEmployee(null);
      setFormData({ name: '', email: '', phone: '', password: '', role: 'SALES', status: 'Active' });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (isSaving) return;
    setIsSaving(true);
    
    const token = localStorage.getItem('token');
    const url = editingEmployee 
      ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/employees/${editingEmployee.id}` 
      : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}` + '/api/employees';
    const method = editingEmployee ? 'PUT' : 'POST';

    try {
      const payload = { ...formData };
      if (editingEmployee) delete payload.password; // Don't send empty password on update

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showToast(`Employee ${editingEmployee ? 'updated' : 'added'} successfully!`);
        setIsModalOpen(false);
        fetchEmployees();
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to save employee', 'error');
      }
    } catch (err) {
      showToast('Error occurred while saving', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (emp) => {
    setConfirmModal({
      isOpen: true,
      type: 'DELETE',
      data: emp.id,
      title: 'Remove Employee',
      message: `Are you sure you want to remove ${emp.name}? This action cannot be undone.`,
      confirmText: 'Remove',
      btnStyle: 'btn-danger'
    });
  };

  const executeDelete = async (id) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/employees/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        showToast('Employee removed');
        fetchEmployees();
      } else {
        showToast('Failed to delete', 'error');
      }
    } catch (err) {
      showToast('Error occurred', 'error');
    }
  };

  const handleImpersonate = (emp) => {
    setConfirmModal({
      isOpen: true,
      type: 'IMPERSONATE',
      data: emp,
      title: 'Login as Employee',
      message: `Are you sure you want to login as ${emp.name}? You will be logged out of your Admin account.`,
      confirmText: 'Login as ' + emp.name,
      btnStyle: 'btn-primary'
    });
  };

  const executeImpersonate = async (emp) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/auth/impersonate/${emp.id}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Set new token and user
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        // Force reload to apply new token to layout and redirect to dashboard
        window.location.href = '/';
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to impersonate', 'error');
      }
    } catch (err) {
      showToast('Error occurred while trying to login', 'error');
    }
  };

  const executeConfirmAction = () => {
    if (confirmModal.type === 'DELETE') {
      executeDelete(confirmModal.data);
    } else if (confirmModal.type === 'IMPERSONATE') {
      executeImpersonate(confirmModal.data);
    }
    setConfirmModal({ ...confirmModal, isOpen: false });
  };

  const filteredEmployees = employees.filter(emp => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return emp.name.toLowerCase().includes(q) || emp.email.toLowerCase().includes(q) || (emp.phone && emp.phone.includes(q));
    return true;
  });

  // Pagination Logic
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentEmployees = filteredEmployees.slice(startIndex, startIndex + itemsPerPage);

  // Reset page when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  return (
    <div className="employees-container">
      {toast && (
        <div className={`toast-message toast-${toast.type}`}>
          {toast.message}
        </div>
      )}

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{maxWidth: '500px'}}>
            <div className="modal-header">
              <h2>{editingEmployee ? 'Edit Employee' : 'Add Employee'}</h2>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label>Full Name *</label>
                <input type="text" required className="filter-input" style={{width: '100%'}} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Enter full name" />
              </div>
              <div className="form-group" style={{marginTop: '15px'}}>
                <label>Email Address *</label>
                <input type="email" required className="filter-input" style={{width: '100%'}} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="Enter email address" />
              </div>
              <div className="form-group" style={{marginTop: '15px'}}>
                <label>{editingEmployee ? 'Reset Password (Optional)' : 'Temporary Password *'}</label>
                <input 
                  type="password" 
                  required={!editingEmployee} 
                  className="filter-input" 
                  style={{width: '100%'}} 
                  value={formData.password} 
                  onChange={e => setFormData({...formData, password: e.target.value})} 
                  placeholder={editingEmployee ? "Enter new password to reset" : "Enter temporary password"} 
                />
              </div>
              <div className="form-group" style={{marginTop: '15px'}}>
                <label>Phone Number</label>
                <input type="text" className="filter-input" style={{width: '100%'}} value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="Enter phone number" />
              </div>
              
              <div style={{display: 'flex', gap: '15px', marginTop: '15px'}}>
                <div className="form-group" style={{flex: 1}}>
                  <label>Role</label>
                  <select className="filter-input" style={{width: '100%'}} value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                    <option value="SALES">Sales Employee</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
                <div className="form-group" style={{flex: 1}}>
                  <label>Status</label>
                  <select className="filter-input" style={{width: '100%'}} value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer" style={{marginTop: '25px'}}>
                <button type="button" className="btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={isSaving}>
                  {isSaving ? 'Saving...' : (editingEmployee ? 'Update Employee' : 'Add Employee')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Employee Modal */}
      {viewingEmployee && (
        <div className="modal-overlay">
          <div className="modal-content" style={{maxWidth: '450px'}}>
            <div className="modal-header">
              <h2>Employee Profile</h2>
              <button className="close-btn" onClick={() => setViewingEmployee(null)}>×</button>
            </div>
            <div className="view-details-container" style={{padding: '20px 0'}}>
              <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '25px'}}>
                <div style={{
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  width: '80px', 
                  height: '80px', 
                  fontSize: '32px', 
                  backgroundColor: '#e3f2fd', 
                  color: '#1976d2', 
                  marginBottom: '15px',
                  borderRadius: '50%',
                  fontWeight: '600'
                }}>
                  {viewingEmployee.name ? viewingEmployee.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <h3 style={{fontSize: '22px', marginBottom: '5px'}}>{viewingEmployee.name}</h3>
                <span className={`emp-status-badge status-${viewingEmployee.status?.toLowerCase() || 'active'}`}>
                  {viewingEmployee.status || 'Active'}
                </span>
              </div>

              <div style={{backgroundColor: '#f5f7fa', padding: '20px', borderRadius: '12px'}}>
                <div style={{display: 'grid', gridTemplateColumns: '1fr', gap: '15px'}}>
                  <div>
                    <p style={{fontSize: '12px', color: '#666', marginBottom: '4px'}}>Role</p>
                    <p style={{fontWeight: '600', color: '#1976d2'}}>{viewingEmployee.role === 'ADMIN' ? 'Administrator' : 'Sales Employee'}</p>
                  </div>
                  <div>
                    <p style={{fontSize: '12px', color: '#666', marginBottom: '4px'}}>Email Address</p>
                    <p style={{fontWeight: '500'}}>✉️ {viewingEmployee.email}</p>
                  </div>
                  <div>
                    <p style={{fontSize: '12px', color: '#666', marginBottom: '4px'}}>Phone Number</p>
                    <p style={{fontWeight: '500'}}>📞 {viewingEmployee.phone || 'Not provided'}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer" style={{marginTop: '0'}}>
              <button className="btn-primary" onClick={() => setViewingEmployee(null)} style={{width: '100%'}}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{maxWidth: '400px', textAlign: 'center', padding: '30px'}}>
            <div style={{fontSize: '40px', marginBottom: '15px'}}>
              {confirmModal.type === 'DELETE' ? '🗑️' : '🔐'}
            </div>
            <h2 style={{marginBottom: '10px'}}>{confirmModal.title}</h2>
            <p style={{color: '#666', marginBottom: '25px', lineHeight: '1.5'}}>
              {confirmModal.message}
            </p>
            <div style={{display: 'flex', gap: '15px', justifyContent: 'center'}}>
              <button className="btn-outline" onClick={() => setConfirmModal({...confirmModal, isOpen: false})} style={{flex: 1}}>Cancel</button>
              <button 
                className={confirmModal.btnStyle || 'btn-primary'} 
                onClick={executeConfirmAction} 
                style={{flex: 1, backgroundColor: confirmModal.btnStyle === 'btn-danger' ? '#ef4444' : '', borderColor: confirmModal.btnStyle === 'btn-danger' ? '#ef4444' : ''}}
              >
                {confirmModal.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="employees-header">
        <div>
          <h1>Employees</h1>
          <p className="subtitle">Manage your sales team</p>
        </div>
        <div style={{display: 'flex', gap: '15px', alignItems: 'center'}}>
          <SearchBox 
            value={searchQuery} 
            onChange={setSearchQuery} 
            placeholder="Search employees..." 
          />
          <button className="btn-primary" onClick={() => handleOpenModal()} style={{height: '100%'}}>+ Add Employee</button>
        </div>
      </div>

      <div className="employees-content-card">
        <div className="table-responsive">
          <table className="employees-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="6">
                    <div className="empty-state">
                      <div className="spinner"></div>
                      <h3>Loading Employees...</h3>
                      <p>Please wait while we fetch the team members.</p>
                    </div>
                  </td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan="6">
                    <div className="empty-state">
                      <div className="empty-state-icon">👤</div>
                      <h3>No Employees Found</h3>
                      <p>We couldn't find any team members matching your search.</p>
                      <button className="btn-primary" onClick={() => handleOpenModal()}>+ Add Employee</button>
                    </div>
                  </td>
                </tr>
              ) : (
                currentEmployees.map((emp) => (
                  <tr key={emp.id}>
                    <td style={{fontWeight: '600'}}>{emp.name}</td>
                    <td style={{color: '#666'}}>{emp.email}</td>
                    <td style={{color: '#666'}}>{emp.phone || '-'}</td>
                    <td>{emp.role === 'ADMIN' ? 'Admin' : 'Sales Employee'}</td>
                    <td>
                      <span className={`emp-status-badge status-${emp.status?.toLowerCase() || 'active'}`}>
                        {emp.status || 'Active'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn-icon" title={`Login as ${emp.name}`} onClick={() => handleImpersonate(emp)}>🔑</button>
                        <button className="btn-icon" title="View Employee" onClick={() => setViewingEmployee(emp)}>👁️</button>
                        <button className="btn-icon" title="Edit Employee" onClick={() => handleOpenModal(emp)}>✏️</button>
                        {emp.role !== 'ADMIN' && (
                          <button className="btn-icon" title="Remove Employee" onClick={() => handleDelete(emp)}>🗑️</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination 
          currentPage={currentPage} 
          totalPages={totalPages} 
          onPageChange={setCurrentPage} 
        />
      </div>
    </div>
  );
}

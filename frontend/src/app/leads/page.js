'use client';
import { useState, useEffect } from 'react';
import './Leads.css';
import Pagination from '../../components/Pagination';
import SearchBox from '../../components/SearchBox';
import * as XLSX from 'xlsx';

export default function Leads() {
  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState({ total: 0, new: 0, siteVisits: 0, booked: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState(null); // Toast state
  const [errors, setErrors] = useState({}); // Field error states
  const [isLoading, setIsLoading] = useState(true); // Loading state
  const [employees, setEmployees] = useState([]); // Store employees list
  const [projects, setProjects] = useState([]); // Store unique projects list
  const [currentUser, setCurrentUser] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStage, setFilterStage] = useState('All Stages');
  const [filterAssignedTo, setFilterAssignedTo] = useState('All Assigned To');
  const [filterDateRange, setFilterDateRange] = useState('All Time');
  const [customDateFilter, setCustomDateFilter] = useState('');
  const [viewingLead, setViewingLead] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, data: null, isBulk: false });
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [bulkAssignModal, setBulkAssignModal] = useState({ isOpen: false, assignedTo: '' });
  
  // Form state
  const [formData, setFormData] = useState({
    name: '', phone: '', email: '', property_interested: '', property_type: '', budget: '',
    stage: 'New', assigned_to: '', source: 'Website', follow_up_date: '', notes: ''
  });

  const fetchLeads = async () => {
    const token = localStorage.getItem('token');
    try {
      setIsLoading(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}` + '/api/leads', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (!Array.isArray(data)) {
        console.warn('API returned non-array:', data);
        setLeads([]);
        setStats({ total: 0, new: 0, siteVisits: 0, booked: 0 });
        if (data.error === 'Token is not valid' || data.error === 'No token, authorization denied') {
           // User needs to login again
           window.location.href = '/login';
        }
        return;
      }

      setLeads(data);

      const total = data.length;
      const newLeads = data.filter(l => l.stage === 'New').length;
      const siteVisits = data.filter(l => l.stage === 'Site Visit').length;
      const booked = data.filter(l => l.stage === 'Booked').length;
      setStats({ total, new: newLeads, siteVisits, booked });
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEmployees = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}` + '/api/employees', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setEmployees(data);
      }
    } catch (err) {
      console.error('Failed to fetch employees', err);
    }
  };

  const fetchProperties = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}` + '/api/properties', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        const uniqueProjects = [...new Set(data.map(p => p.project_name))].filter(Boolean);
        setProjects(uniqueProjects);
      }
    } catch (err) {
      console.error('Failed to fetch properties', err);
    }
  };

  useEffect(() => {
    fetchLeads();
    fetchEmployees();
    fetchProperties();
    const userData = localStorage.getItem('user');
    if (userData) {
      setCurrentUser(JSON.parse(userData));
    }
  }, []);

  const handleOpenModal = (lead = null) => {
    if (lead) {
      setEditingLead(lead.id);
      setFormData({
        name: lead.name || '',
        phone: lead.phone || '',
        email: lead.email || '',
        property_interested: lead.property_interested || '',
        property_type: lead.property_type || '',
        budget: lead.budget || '',
        stage: lead.stage || 'New',
        assigned_to: lead.assigned_to || '',
        source: lead.source || 'Website',
        follow_up_date: lead.follow_up_date 
          ? new Date(new Date(lead.follow_up_date).getTime() - (new Date(lead.follow_up_date).getTimezoneOffset() * 60000)).toISOString().slice(0, 16)
          : '',
        notes: lead.notes || ''
      });
    } else {
      setEditingLead(null);
      setFormData({ name: '', phone: '', email: '', property_interested: '', property_type: '', budget: '', stage: 'New', assigned_to: '', source: 'Website', follow_up_date: '', notes: '' });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    // Validation
    const newErrors = {};
    
    if (!formData.name.trim()) newErrors.name = true;
    if (!formData.phone.trim() || formData.phone.length < 10) newErrors.phone = true;
    if (!formData.email.trim() || !formData.email.includes('@')) newErrors.email = true;
    if (!formData.property_interested) newErrors.property_interested = true;
    if (!formData.stage) newErrors.stage = true;
    if (currentUser?.role === 'ADMIN' && !formData.assigned_to) newErrors.assigned_to = true;
    if (!formData.source) newErrors.source = true;
    if (!formData.follow_up_date) newErrors.follow_up_date = true;
    if (!formData.notes.trim()) newErrors.notes = true;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      
      // Determine the most specific, professional error message to show
      if (newErrors.email && formData.email.trim().length > 0) {
        showToast('Please enter a valid email address.', 'error');
      } else if (newErrors.phone && formData.phone.trim().length > 0) {
        showToast('Phone number must contain at least 10 digits.', 'error');
      } else {
        showToast('Please complete all required fields highlighted in red.', 'error');
      }
      return;
    }

    if (isSaving) return; // Prevent double clicks
    
    setIsSaving(true);
    const token = localStorage.getItem('token');
    const method = editingLead ? 'PUT' : 'POST';
    const url = editingLead ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/leads/${editingLead}` : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}` + '/api/leads';

    // Ensure the date is sent correctly with timezone to avoid POST/PUT parsing differences
    const payload = { ...formData };
    if (payload.follow_up_date) {
      payload.follow_up_date = new Date(payload.follow_up_date).toISOString();
    }

    try {
      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setIsModalOpen(false);
        showToast(editingLead ? 'Lead updated successfully!' : 'Lead added successfully!');
        fetchLeads(); // Refresh list
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to save lead', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('An error occurred. Please try again.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const getStageColor = (stage) => {
    switch(stage) {
      case 'New': return 'badge-new';
      case 'Contacted': return 'badge-contacted';
      case 'Site Visit': return 'badge-site-visit';
      case 'Interested': return 'badge-interested';
      case 'Negotiation': return 'badge-negotiation';
      case 'Booked': return 'badge-booked';
      case 'Lost': return 'badge-lost';
      default: return '';
    }
  };

  const filteredLeads = leads.filter(lead => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match = 
        (lead.name?.toLowerCase().includes(q)) || 
        (lead.phone?.toLowerCase().includes(q)) || 
        (lead.email?.toLowerCase().includes(q));
      if (!match) return false;
    }
    if (filterStage !== 'All Stages' && lead.stage !== filterStage) return false;
    
    if (filterAssignedTo !== 'All Assigned To') {
      const assigned = lead.assigned_to || 'Not Assigned';
      if (assigned !== filterAssignedTo) return false;
    }

    if (filterDateRange !== 'All Time') {
      if (!lead.follow_up_date) return false;
      const followUp = new Date(lead.follow_up_date);
      const today = new Date();
      
      if (filterDateRange === 'Today') {
        if (followUp.toDateString() !== today.toDateString()) return false;
      } else if (filterDateRange === 'This Week') {
        const diffDays = (followUp - today) / (1000 * 60 * 60 * 24);
        if (diffDays < 0 || diffDays > 7) return false;
      } else if (filterDateRange === 'This Month') {
        if (followUp.getMonth() !== today.getMonth() || followUp.getFullYear() !== today.getFullYear()) return false;
      } else if (filterDateRange === 'Custom') {
        if (!customDateFilter) return true;
        const customDateObj = new Date(customDateFilter);
        if (followUp.toDateString() !== customDateObj.toDateString()) return false;
      }
    }
    
    return true;
  });

  // Pagination Logic
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const totalPages = Math.ceil(filteredLeads.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentLeads = filteredLeads.slice(startIndex, startIndex + itemsPerPage);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterStage, filterAssignedTo, filterDateRange, customDateFilter]);

  const handleDelete = (lead) => {
    setConfirmModal({
      isOpen: true,
      data: lead,
      isBulk: false
    });
  };

  const handleBulkDelete = () => {
    setConfirmModal({
      isOpen: true,
      data: null,
      isBulk: true
    });
  };

  const executeBulkDelete = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/leads/bulk-delete`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ leadIds: selectedLeads })
      });
      if (res.ok) {
        showToast(`${selectedLeads.length} leads deleted successfully!`);
        setSelectedLeads([]);
        fetchLeads();
      } else {
        showToast('Failed to bulk delete leads', 'error');
      }
    } catch (err) {
      showToast('Error deleting leads', 'error');
    }
    setConfirmModal({ isOpen: false, data: null, isBulk: false });
  };

  const executeBulkAssign = async () => {
    if (!bulkAssignModal.assignedTo) {
      return showToast('Please select an employee', 'error');
    }
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/leads/bulk-assign`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ leadIds: selectedLeads, assigned_to: bulkAssignModal.assignedTo })
      });
      if (res.ok) {
        showToast(`${selectedLeads.length} leads assigned to ${bulkAssignModal.assignedTo}!`);
        setSelectedLeads([]);
        setBulkAssignModal({ isOpen: false, assignedTo: '' });
        fetchLeads();
      } else {
        showToast('Failed to bulk assign leads', 'error');
      }
    } catch (err) {
      showToast('Error assigning leads', 'error');
    }
  };

  const exportToExcel = () => {
    if (filteredLeads.length === 0) return showToast('No leads to export', 'error');
    
    // Create data array
    const data = filteredLeads.map(lead => ({
      'Name': lead.name || '',
      'Phone': lead.phone || '',
      'Email': lead.email || '',
      'Stage': lead.stage || '',
      'Assigned To': lead.assigned_to || '',
      'Source': lead.source || '',
      'Follow Up Date': lead.follow_up_date ? new Date(lead.follow_up_date).toLocaleString() : '',
      'Notes': (lead.notes || '').replace(/\n/g, ' - ')
    }));

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(data);

    // Calculate maximum width for each column to auto-size them
    const colWidths = Object.keys(data[0] || {}).map(key => {
      // Get the max length of the values in the column, plus header length
      const maxLen = Math.max(
        key.length, 
        ...data.map(row => (row[key] ? row[key].toString().length : 0))
      );
      return { wch: maxLen + 2 }; // Add some padding
    });
    
    ws['!cols'] = colWidths;

    // Create workbook and export
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Leads");
    
    XLSX.writeFile(wb, `leads_export_${new Date().getTime()}.xlsx`);
    showToast('Export successful!');
  };

  const executeDelete = async (id) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/leads/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        showToast('Lead deleted successfully!');
        fetchLeads();
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to delete lead', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error deleting lead', 'error');
    }
  };

  return (
    <div className="leads-container">
      {/* Toast Message */}
      {toast && (
        <div className={`toast-message toast-${toast.type}`}>
          {toast.message}
        </div>
      )}

      {/* Modal Overlay */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editingLead ? 'Edit Lead' : 'Add New Lead'}</h2>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleSave} noValidate>
              <div className="form-grid">
                <div className="form-group">
                  <label>Name <span className="required">*</span></label>
                  <input className={errors.name ? 'error-blink' : ''} value={formData.name} onChange={e => {setFormData({...formData, name: e.target.value}); setErrors({...errors, name: false});}} placeholder="Enter customer name" />
                </div>
                <div className="form-group">
                  <label>Phone <span className="required">*</span></label>
                  <input className={errors.phone ? 'error-blink' : ''} value={formData.phone} onChange={e => {setFormData({...formData, phone: e.target.value}); setErrors({...errors, phone: false});}} placeholder="Enter phone number (min 10 digits)" />
                </div>
                <div className="form-group">
                  <label>Email <span className="required">*</span></label>
                  <input type="email" className={errors.email ? 'error-blink' : ''} value={formData.email} onChange={e => {setFormData({...formData, email: e.target.value}); setErrors({...errors, email: false});}} placeholder="Enter email address" />
                </div>
                <div className="form-group">
                  <label>Property Interested <span className="required">*</span></label>
                  <select className={errors.property_interested ? 'error-blink' : ''} value={formData.property_interested} onChange={e => {setFormData({...formData, property_interested: e.target.value}); setErrors({...errors, property_interested: false});}}>
                    <option value="" disabled>Select property</option>
                    {projects.map(proj => (
                      <option key={proj} value={proj}>{proj}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Property Type</label>
                  <select value={formData.property_type} onChange={e => setFormData({...formData, property_type: e.target.value})}>
                    <option value="" disabled>Select Type</option>
                    <option value="1BHK">1BHK</option>
                    <option value="2BHK">2BHK</option>
                    <option value="3BHK">3BHK</option>
                    <option value="Villa">Villa</option>
                    <option value="Plot">Plot</option>
                    <option value="Commercial">Commercial</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Budget (₹)</label>
                  <input 
                    type="number" 
                    value={formData.budget} 
                    onChange={e => setFormData({...formData, budget: e.target.value})} 
                    placeholder="Enter budget amount (e.g. 5000000)" 
                    min="0"
                  />
                </div>
                <div className="form-group">
                  <label>Stage <span className="required">*</span></label>
                  <select className={errors.stage ? 'error-blink' : ''} value={formData.stage} onChange={e => {setFormData({...formData, stage: e.target.value}); setErrors({...errors, stage: false});}}>
                    <option value="New">New</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Site Visit">Site Visit</option>
                    <option value="Interested">Interested</option>
                    <option value="Negotiation">Negotiation</option>
                    <option value="Booked">Booked</option>
                    <option value="Lost">Lost</option>
                  </select>
                </div>
                {currentUser?.role === 'ADMIN' && (
                  <div className="form-group">
                    <label>Assigned To <span className="required">*</span></label>
                    <select className={errors.assigned_to ? 'error-blink' : ''} value={formData.assigned_to} onChange={e => {setFormData({...formData, assigned_to: e.target.value}); setErrors({...errors, assigned_to: false});}}>
                      <option value="" disabled>Select employee</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.name}>{emp.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="form-group">
                  <label>Source <span className="required">*</span></label>
                  <select className={errors.source ? 'error-blink' : ''} value={formData.source} onChange={e => {setFormData({...formData, source: e.target.value}); setErrors({...errors, source: false});}}>
                    <option value="Website">Website</option>
                    <option value="Walk-in">Walk-in</option>
                    <option value="Referral">Referral</option>
                    <option value="Social Media">Social Media</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Follow Up Date & Time <span className="required">*</span></label>
                  <input type="datetime-local" className={errors.follow_up_date ? 'error-blink' : ''} value={formData.follow_up_date} onChange={e => {setFormData({...formData, follow_up_date: e.target.value}); setErrors({...errors, follow_up_date: false});}} />
                </div>
                <div className="form-group" style={{gridColumn: '1 / -1'}}>
                  <label>Notes <span className="required">*</span></label>
                  <textarea rows="3" className={errors.notes ? 'error-blink' : ''} value={formData.notes} onChange={e => {setFormData({...formData, notes: e.target.value}); setErrors({...errors, notes: false});}} placeholder="Add notes here..."></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={isSaving} style={{opacity: isSaving ? 0.7 : 1, cursor: isSaving ? 'not-allowed' : 'pointer'}}>
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{maxWidth: '400px', textAlign: 'center', padding: '30px'}}>
            <div style={{fontSize: '40px', marginBottom: '15px'}}>🗑️</div>
            <h2 style={{marginBottom: '10px'}}>{confirmModal.isBulk ? 'Bulk Delete Leads' : 'Delete Lead'}</h2>
            <p style={{color: '#666', marginBottom: '25px', lineHeight: '1.5'}}>
              {confirmModal.isBulk 
                ? `Are you sure you want to delete ${selectedLeads.length} selected leads? This action cannot be undone.`
                : `Are you sure you want to delete ${confirmModal.data?.name}? This action cannot be undone.`}
            </p>
            <div style={{display: 'flex', gap: '15px', justifyContent: 'center'}}>
              <button className="btn-outline" onClick={() => setConfirmModal({isOpen: false, data: null, isBulk: false})} style={{flex: 1}}>Cancel</button>
              <button 
                className="btn-danger"
                onClick={() => {
                  if (confirmModal.isBulk) executeBulkDelete();
                  else { executeDelete(confirmModal.data.id); setConfirmModal({isOpen: false, data: null, isBulk: false}); }
                }} 
                style={{flex: 1, backgroundColor: '#ef4444', borderColor: '#ef4444', color: 'white'}}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Assign Modal */}
      {bulkAssignModal.isOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{maxWidth: '400px', padding: '30px'}}>
            <h2 style={{marginBottom: '10px'}}>Assign {selectedLeads.length} Leads</h2>
            <p style={{color: '#666', marginBottom: '20px'}}>Select an employee to assign the selected leads.</p>
            
            <div className="form-group">
              <label>Assign To</label>
              <select 
                className="form-input" 
                value={bulkAssignModal.assignedTo} 
                onChange={(e) => setBulkAssignModal({...bulkAssignModal, assignedTo: e.target.value})}
              >
                <option value="">Select Employee...</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.name}>{emp.name}</option>
                ))}
              </select>
            </div>

            <div style={{display: 'flex', gap: '15px', marginTop: '20px'}}>
              <button className="btn-outline" onClick={() => setBulkAssignModal({isOpen: false, assignedTo: ''})} style={{flex: 1}}>Cancel</button>
              <button className="btn-primary" onClick={executeBulkAssign} style={{flex: 1}}>Assign</button>
            </div>
          </div>
        </div>
      )}

      {/* View Lead Modal */}
      {viewingLead && (
        <div className="modal-overlay">
          <div className="modal-content" style={{maxWidth: '600px'}}>
            <div className="modal-header">
              <h2>Lead Details</h2>
              <button className="close-btn" onClick={() => setViewingLead(null)}>×</button>
            </div>
            <div className="view-details-container" style={{padding: '20px 0'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #eee'}}>
                <div className="avatar-mini" style={{width: '60px', height: '60px', fontSize: '24px', backgroundColor: '#e3f2fd', color: '#1976d2'}}>
                  {viewingLead.name ? viewingLead.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                  <h3 style={{fontSize: '20px', marginBottom: '5px'}}>{viewingLead.name}</h3>
                  <p style={{color: '#666', fontSize: '14px'}}>📞 {viewingLead.phone || 'No phone'} &nbsp; | &nbsp; ✉️ {viewingLead.email || 'No email'}</p>
                </div>
              </div>

              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px'}}>
                <div>
                  <p style={{fontSize: '12px', color: '#666', marginBottom: '4px'}}>Stage</p>
                  <span className={`badge ${getStageColor(viewingLead.stage)}`}>{viewingLead.stage || 'New'}</span>
                </div>
                <div>
                  <p style={{fontSize: '12px', color: '#666', marginBottom: '4px'}}>Property Interested</p>
                  <p style={{fontWeight: '500'}}>{viewingLead.property_interested || 'Not specified'}</p>
                </div>
                <div>
                  <p style={{fontSize: '12px', color: '#666', marginBottom: '4px'}}>Property Type</p>
                  <p style={{fontWeight: '500'}}>{viewingLead.property_type || 'Not specified'}</p>
                </div>
                <div>
                  <p style={{fontSize: '12px', color: '#666', marginBottom: '4px'}}>Budget</p>
                  <p style={{fontWeight: '500'}}>{viewingLead.budget || 'Not specified'}</p>
                </div>
                <div>
                  <p style={{fontSize: '12px', color: '#666', marginBottom: '4px'}}>Source</p>
                  <p style={{fontWeight: '500'}}>{viewingLead.source || 'Website'}</p>
                </div>
                <div>
                  <p style={{fontSize: '12px', color: '#666', marginBottom: '4px'}}>Assigned To</p>
                  <p style={{fontWeight: '500'}}>{viewingLead.assigned_to || 'Not Assigned'}</p>
                </div>
                <div style={{gridColumn: '1 / -1'}}>
                  <p style={{fontSize: '12px', color: '#666', marginBottom: '4px'}}>Follow Up Date & Time</p>
                  <p style={{fontWeight: '500'}}>
                    {viewingLead.follow_up_date 
                      ? new Date(viewingLead.follow_up_date).toLocaleString('en-IN', {day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true}) 
                      : 'Not Scheduled'}
                  </p>
                </div>
              </div>

              <div style={{backgroundColor: '#f5f7fa', padding: '20px', borderRadius: '8px', maxHeight: '250px', overflowY: 'auto'}}>
                <p style={{fontSize: '12px', color: '#666', marginBottom: '15px', fontWeight: '600', textTransform: 'uppercase'}}>Activity & Notes History</p>
                <div style={{ position: 'relative', paddingLeft: '15px', borderLeft: '2px solid #e2e8f0' }}>
                  {viewingLead.notes ? viewingLead.notes.split('\n').filter(n => n.trim()).map((note, idx) => (
                    <div key={idx} style={{ position: 'relative', marginBottom: '15px' }}>
                      <div style={{ position: 'absolute', left: '-21px', top: '2px', width: '10px', height: '10px', borderRadius: '50%', background: '#1976d2', border: '2px solid #e3f2fd' }}></div>
                      <p style={{fontSize: '14px', lineHeight: '1.5', color: '#333', background: 'white', padding: '10px', borderRadius: '6px', border: '1px solid #eee', boxShadow: '0 1px 2px rgba(0,0,0,0.05)'}}>
                        {note}
                      </p>
                    </div>
                  )) : (
                    <p style={{fontSize: '14px', color: '#888', fontStyle: 'italic'}}>No activity recorded yet.</p>
                  )}
                </div>
              </div>
            </div>
            <div className="modal-footer" style={{marginTop: '0'}}>
              <button className="btn-primary" onClick={() => setViewingLead(null)} style={{width: '100%'}}>Close</button>
            </div>
          </div>
        </div>
      )}

      <div className="leads-header">
        <div>
          <h1>Leads</h1>
          <p className="subtitle">Manage and track all customer leads</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-outline" onClick={exportToExcel}>⬇️ Export Excel</button>
          <button className="btn-primary" onClick={() => handleOpenModal()}>+ Add Lead</button>
        </div>
      </div>

      <div className="metrics-grid">
        <div className="metric-card interactive-card" onClick={() => setFilterStage('All Stages')} style={{cursor: 'pointer', border: filterStage === 'All Stages' ? '2px solid var(--accent-color)' : ''}}>
          <div className="metric-icon blue">👥</div>
          <div className="metric-info">
            <p className="metric-label">Total Leads</p>
            <h2 className="metric-value">{stats.total}</h2>
          </div>
        </div>
        <div className="metric-card interactive-card" onClick={() => setFilterStage('New')} style={{cursor: 'pointer', border: filterStage === 'New' ? '2px solid #4caf50' : ''}}>
          <div className="metric-icon green">✅</div>
          <div className="metric-info">
            <p className="metric-label">New Leads</p>
            <h2 className="metric-value">{stats.new}</h2>
          </div>
        </div>
        <div className="metric-card interactive-card" onClick={() => setFilterStage('Site Visit')} style={{cursor: 'pointer', border: filterStage === 'Site Visit' ? '2px solid #9c27b0' : ''}}>
          <div className="metric-icon purple">🏢</div>
          <div className="metric-info">
            <p className="metric-label">Site Visits</p>
            <h2 className="metric-value">{stats.siteVisits}</h2>
          </div>
        </div>
        <div className="metric-card interactive-card" onClick={() => setFilterStage('Booked')} style={{cursor: 'pointer', border: filterStage === 'Booked' ? '2px solid #f44336' : ''}}>
          <div className="metric-icon red">📅</div>
          <div className="metric-info">
            <p className="metric-label">Booked</p>
            <h2 className="metric-value">{stats.booked}</h2>
          </div>
        </div>
      </div>

      <div className="leads-content-card">
        <div className="filters-row">
          {selectedLeads.length > 0 ? (
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center', background: '#e3f2fd', padding: '8px 15px', borderRadius: '8px', border: '1px solid #90caf9', width: '100%' }}>
              <span style={{ fontWeight: '600', color: '#1976d2' }}>{selectedLeads.length} leads selected</span>
              {currentUser?.role === 'ADMIN' && (
                <>
                  <button className="btn-primary" style={{ padding: '6px 12px', fontSize: '13px', marginLeft: 'auto' }} onClick={() => setBulkAssignModal({ isOpen: true, assignedTo: '' })}>Bulk Assign</button>
                  <button className="btn-danger" style={{ padding: '6px 12px', fontSize: '13px' }} onClick={handleBulkDelete}>Bulk Delete</button>
                </>
              )}
              <button className="btn-outline" style={{ padding: '6px 12px', fontSize: '13px', border: 'none', marginLeft: currentUser?.role !== 'ADMIN' ? 'auto' : '0' }} onClick={() => setSelectedLeads([])}>Cancel</button>
            </div>
          ) : (
            <>
              <SearchBox 
                value={searchQuery} 
                onChange={setSearchQuery} 
                placeholder="Search by name, phone, email..." 
              />
              <select className="filter-input" value={filterStage} onChange={e => setFilterStage(e.target.value)}>
                <option value="All Stages">All Stages</option>
                <option value="New">New</option>
                <option value="Contacted">Contacted</option>
                <option value="Site Visit">Site Visit</option>
                <option value="Interested">Interested</option>
                <option value="Negotiation">Negotiation</option>
                <option value="Booked">Booked</option>
                <option value="Lost">Lost</option>
              </select>
              {currentUser?.role === 'ADMIN' && (
                <select className="filter-input" value={filterAssignedTo} onChange={e => setFilterAssignedTo(e.target.value)}>
                  <option value="All Assigned To">All Assigned To</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.name}>{emp.name}</option>
                  ))}
                  <option value="Not Assigned">Not Assigned</option>
                </select>
              )}
              <select className="filter-input">
                <option>All Sources</option>
                <option value="Website">Website</option>
              </select>
            </>
          )}
          <div style={{display: 'flex', gap: '8px'}}>
            <select className="filter-input" value={filterDateRange} onChange={e => setFilterDateRange(e.target.value)}>
              <option value="All Time">Select Date Range</option>
              <option value="Today">Today</option>
              <option value="This Week">This Week</option>
              <option value="This Month">This Month</option>
              <option value="Custom">Custom Date</option>
            </select>
            {filterDateRange === 'Custom' && (
              <input type="date" className="filter-input" value={customDateFilter} onChange={e => setCustomDateFilter(e.target.value)} />
            )}
          </div>
        </div>

        <div className="table-responsive">
          <table className="leads-table">
            <thead>
              <tr>
                <th>
                  <input 
                    type="checkbox" 
                    checked={currentLeads.length > 0 && selectedLeads.length === currentLeads.length}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedLeads(currentLeads.map(l => l.id));
                      else setSelectedLeads([]);
                    }}
                  />
                </th>
                <th>Name</th>
                <th>Phone</th>
                <th>Follow-up Date</th>
                <th>Stage</th>
                <th>Email</th>
                <th>Assigned To</th>
                <th>Source</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="9">
                    <div className="empty-state">
                      <div className="spinner"></div>
                      <h3>Loading Leads...</h3>
                      <p>Please wait while we fetch the latest data.</p>
                    </div>
                  </td>
                </tr>
              ) : filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan="9">
                    <div className="empty-state">
                      <div className="empty-state-icon">👥</div>
                      <h3>No Leads Found</h3>
                      <p>We couldn't find any leads matching your criteria. Try adjusting your search filters or create a new lead.</p>
                      <button className="btn-primary" onClick={() => handleOpenModal()}>+ Add Lead</button>
                    </div>
                  </td>
                </tr>
              ) : (
                currentLeads.map((lead, index) => (
                  <tr key={lead.id || index} style={{ backgroundColor: selectedLeads.includes(lead.id) ? '#f0f9ff' : '' }}>
                    <td>
                      <input 
                        type="checkbox" 
                        checked={selectedLeads.includes(lead.id)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedLeads([...selectedLeads, lead.id]);
                          else setSelectedLeads(selectedLeads.filter(id => id !== lead.id));
                        }}
                      />
                    </td>
                    <td>
                      <div className="table-user">
                        <div className="avatar-mini" style={{backgroundColor: ['#e3f2fd', '#ffebee', '#f3e5f5'][index % 3], color: ['#1976d2', '#e53935', '#8e24aa'][index % 3]}}>
                          {lead.name ? lead.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        {lead.name}
                      </div>
                    </td>
                    <td>{lead.phone || '-'}</td>
                    <td>📅 {lead.follow_up_date ? new Date(lead.follow_up_date).toLocaleString('en-IN', {day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true}) : '-'}</td>
                    <td><span className={`badge ${getStageColor(lead.stage)}`}>{lead.stage || 'New'}</span></td>
                    <td>{lead.email || '-'}</td>
                    <td>
                      <div className="table-user">
                        <div className="avatar-mini" style={{backgroundColor: '#e8f5e9', color: '#388e3c'}}>
                          {lead.assigned_to ? lead.assigned_to.charAt(0).toUpperCase() : '-'}
                        </div>
                        {lead.assigned_to || 'Not Assigned'}
                      </div>
                    </td>
                    <td><span className="badge badge-source">{lead.source || 'Website'}</span></td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn-icon" title="View Lead" onClick={() => setViewingLead(lead)}>👁️</button>
                        <button className="btn-icon" onClick={() => handleOpenModal(lead)} title="Edit Lead">✏️</button>
                        <button className="btn-icon" onClick={() => handleDelete(lead)} title="Delete Lead">🗑️</button>
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

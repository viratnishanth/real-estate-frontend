'use client';
import { useState, useEffect } from 'react';
import './Bookings.css';
import Pagination from '../../components/Pagination';
import SearchBox from '../../components/SearchBox';

export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [properties, setProperties] = useState([]);
  const [leads, setLeads] = useState([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [selectedLead, setSelectedLead] = useState(null);
  const [leadSearchQuery, setLeadSearchQuery] = useState('');
  const [bookingSearchQuery, setBookingSearchQuery] = useState('');
  
  const [viewingBooking, setViewingBooking] = useState(null);
  const [editingBooking, setEditingBooking] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, data: null });
  
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = async () => {
    const token = localStorage.getItem('token');
    try {
      setIsLoading(true);
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const [bookRes, propRes, leadRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}` + '/api/bookings', { headers }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}` + '/api/properties', { headers }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}` + '/api/leads', { headers })
      ]);

      if (bookRes.ok) {
        const bookData = await bookRes.json();
        setBookings(Array.isArray(bookData) ? bookData : []);
      }
      if (propRes.ok) {
        const propData = await propRes.json();
        setProperties(Array.isArray(propData) ? propData : []);
      }
      if (leadRes.ok) {
        const leadData = await leadRes.json();
        setLeads(Array.isArray(leadData) ? leadData : []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const userData = localStorage.getItem('user');
    if (userData) {
      setCurrentUser(JSON.parse(userData));
    }
  }, []);

  const openBookingFlow = () => {
    setCurrentStep(1);
    setSelectedProperty(null);
    setSelectedLead(null);
    setLeadSearchQuery('');
    setIsModalOpen(true);
  };

  const handleNextStep = () => {
    if (currentStep === 1 && !selectedProperty) {
      showToast('Please select a property first', 'error');
      return;
    }
    if (currentStep === 2 && !selectedLead) {
      showToast('Please select a customer/lead', 'error');
      return;
    }
    setCurrentStep(currentStep + 1);
  };

  const handleConfirmBooking = async () => {
    if (isSaving) return;
    setIsSaving(true);
    const token = localStorage.getItem('token');
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}` + '/api/bookings', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          lead_id: selectedLead.id,
          property_id: selectedProperty.id
        })
      });
      
      if (res.ok) {
        showToast('Booking confirmed successfully!');
        setIsModalOpen(false);
        fetchData(); // refresh data
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to confirm booking', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('An error occurred.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteBooking = (booking) => {
    setConfirmModal({
      isOpen: true,
      data: booking
    });
  };

  const executeDeleteBooking = async (id) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/bookings/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        showToast('Booking deleted successfully');
        fetchData();
      } else {
        showToast('Failed to delete booking', 'error');
      }
    } catch (err) {
      showToast('Error deleting booking', 'error');
    }
  };

  const handleUpdateStatus = async () => {
    if (isSaving || !editingBooking) return;
    setIsSaving(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/bookings/${editingBooking.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ 
          lead_id: editingBooking.lead_id,
          property_id: editingBooking.property_id,
          status: editingBooking.status 
        })
      });
      if (res.ok) {
        showToast('Booking status updated!');
        setEditingBooking(null);
        fetchData();
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to update status', 'error');
      }
    } catch (err) {
      showToast('Error updating status', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  };

  const availableProperties = properties.filter(p => p.availability === 'Available');

  // Filter out lost leads, and apply search query
  const filteredLeads = leads.filter(lead => {
    if (lead.stage === 'Lost') return false;
    if (leadSearchQuery && !lead.name.toLowerCase().includes(leadSearchQuery.toLowerCase()) && !lead.phone.includes(leadSearchQuery)) return false;
    return true;
  });

  const filteredBookings = bookings.filter(b => {
    if (!bookingSearchQuery) return true;
    const q = bookingSearchQuery.toLowerCase();
    const bkgId = `#BKG-${b.id.toString().padStart(4, '0')}`.toLowerCase();
    const customer = (b.lead?.name || '').toLowerCase();
    const project = (b.property?.project_name || '').toLowerCase();
    return bkgId.includes(q) || customer.includes(q) || project.includes(q);
  });

  // Pagination Logic
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentBookings = filteredBookings.slice(startIndex, startIndex + itemsPerPage);

  // Reset page when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [bookingSearchQuery]);

  return (
    <div className="bookings-container">
      {toast && (
        <div className={`toast-message toast-${toast.type}`}>
          {toast.message}
        </div>
      )}

      {/* View Booking Modal */}
      {viewingBooking && (
        <div className="modal-overlay">
          <div className="modal-content" style={{maxWidth: '500px'}}>
            <div className="modal-header">
              <h2>Booking Details #BKG-{viewingBooking.id.toString().padStart(4, '0')}</h2>
              <button className="close-btn" onClick={() => setViewingBooking(null)}>×</button>
            </div>
            <div className="booking-modal-body" style={{padding: '20px 0'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '15px'}}>
                <div>
                  <div style={{fontSize: '12px', color: '#666'}}>Status</div>
                  <span className={`status-badge status-${viewingBooking.status.toLowerCase()}`}>{viewingBooking.status}</span>
                </div>
                <div style={{textAlign: 'right'}}>
                  <div style={{fontSize: '12px', color: '#666'}}>Date</div>
                  <div style={{fontWeight: '600'}}>{new Date(viewingBooking.booking_date).toLocaleDateString('en-IN')}</div>
                </div>
              </div>
              
              <h3 style={{fontSize: '15px', marginBottom: '10px', color: 'var(--primary-color)'}}>Property Details</h3>
              <div style={{background: '#f8fafc', padding: '15px', borderRadius: '8px', marginBottom: '20px'}}>
                <div style={{fontWeight: '600', fontSize: '16px'}}>{viewingBooking.property?.project_name}</div>
                <div style={{fontSize: '13px', color: '#666', marginTop: '4px'}}>Building: {viewingBooking.property?.building_name || '-'} | Unit: {viewingBooking.property?.unit_number}</div>
                <div style={{fontWeight: '600', color: '#1976d2', marginTop: '8px', fontSize: '18px'}}>{formatPrice(viewingBooking.property?.price)}</div>
              </div>

              <h3 style={{fontSize: '15px', marginBottom: '10px', color: 'var(--primary-color)'}}>Customer Details</h3>
              <div style={{background: '#f8fafc', padding: '15px', borderRadius: '8px'}}>
                <div style={{fontWeight: '600', fontSize: '16px'}}>{viewingBooking.lead?.name}</div>
                <div style={{fontSize: '13px', color: '#666', marginTop: '4px'}}>Phone: {viewingBooking.lead?.phone}</div>
                <div style={{fontSize: '13px', color: '#666', marginTop: '4px'}}>Email: {viewingBooking.lead?.email}</div>
              </div>
            </div>
            <div className="modal-footer" style={{marginTop: '10px'}}>
              <button className="btn-primary" onClick={() => setViewingBooking(null)} style={{width: '100%'}}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{maxWidth: '400px', textAlign: 'center', padding: '30px'}}>
            <div style={{fontSize: '40px', marginBottom: '15px'}}>🗑️</div>
            <h2 style={{marginBottom: '10px'}}>Delete Booking</h2>
            <p style={{color: '#666', marginBottom: '25px', lineHeight: '1.5'}}>
              Are you sure you want to delete this booking? The property will be made Available again. This action cannot be undone.
            </p>
            <div style={{display: 'flex', gap: '15px', justifyContent: 'center'}}>
              <button className="btn-outline" onClick={() => setConfirmModal({isOpen: false, data: null})} style={{flex: 1}}>Cancel</button>
              <button 
                className="btn-danger"
                onClick={() => { executeDeleteBooking(confirmModal.data.id); setConfirmModal({isOpen: false, data: null}); }} 
                style={{flex: 1, backgroundColor: '#ef4444', borderColor: '#ef4444', color: 'white'}}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{maxWidth: '400px', textAlign: 'center', padding: '30px'}}>
            <div style={{fontSize: '40px', marginBottom: '15px'}}>🗑️</div>
            <h2 style={{marginBottom: '10px'}}>Delete Booking</h2>
            <p style={{color: '#666', marginBottom: '25px', lineHeight: '1.5'}}>
              Are you sure you want to delete this booking? The property will be made Available again. This action cannot be undone.
            </p>
            <div style={{display: 'flex', gap: '15px', justifyContent: 'center'}}>
              <button className="btn-outline" onClick={() => setConfirmModal({isOpen: false, data: null})} style={{flex: 1}}>Cancel</button>
              <button 
                className="btn-danger"
                onClick={() => { executeDeleteBooking(confirmModal.data.id); setConfirmModal({isOpen: false, data: null}); }} 
                style={{flex: 1, backgroundColor: '#ef4444', borderColor: '#ef4444', color: 'white'}}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Booking Modal */}
      {editingBooking && (
        <div className="modal-overlay">
          <div className="modal-content" style={{maxWidth: '500px'}}>
            <div className="modal-header">
              <h2>Edit Booking</h2>
              <button className="close-btn" onClick={() => setEditingBooking(null)}>×</button>
            </div>
            <div className="booking-modal-body" style={{padding: '20px 0'}}>
              
              <div className="form-group">
                <label>Customer (Lead)</label>
                <select 
                  className="filter-input" 
                  style={{width: '100%'}}
                  value={editingBooking.lead_id} 
                  onChange={(e) => setEditingBooking({...editingBooking, lead_id: parseInt(e.target.value)})}
                >
                  {leads.map(lead => (
                    <option key={lead.id} value={lead.id}>{lead.name} ({lead.phone})</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{marginTop: '15px'}}>
                <label>Property Unit</label>
                <select 
                  className="filter-input" 
                  style={{width: '100%'}}
                  value={editingBooking.property_id} 
                  onChange={(e) => setEditingBooking({...editingBooking, property_id: parseInt(e.target.value)})}
                >
                  {properties.map(prop => {
                    // Only show properties that are Available, OR the currently booked property
                    if (prop.availability === 'Available' || prop.id === editingBooking.property_id) {
                      return (
                        <option key={prop.id} value={prop.id}>
                          {prop.project_name} - Unit {prop.unit_number} (₹{prop.price})
                        </option>
                      );
                    }
                    return null;
                  })}
                </select>
              </div>

              <div className="form-group" style={{marginTop: '15px'}}>
                <label>Booking Status</label>
                <select 
                  className="filter-input" 
                  style={{width: '100%'}}
                  value={editingBooking.status} 
                  onChange={(e) => setEditingBooking({...editingBooking, status: e.target.value})}
                >
                  <option value="Confirmed">Confirmed</option>
                  <option value="Pending">Pending</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
                {editingBooking.status === 'Cancelled' && (
                  <p style={{fontSize: '12px', color: '#c62828', marginTop: '8px'}}>Warning: Cancelling this booking will make the property Available again.</p>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-outline" onClick={() => setEditingBooking(null)}>Cancel</button>
              <button className="btn-primary" onClick={handleUpdateStatus} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Update Booking'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Booking Flow Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{maxWidth: '800px', maxHeight: '90vh', display: 'flex', flexDirection: 'column'}}>
            <div className="modal-header">
              <h2>Book Property</h2>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>×</button>
            </div>
            
            {/* Stepper */}
            <div className="stepper-container" style={{marginTop: '10px'}}>
              <div className={`step-item ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
                <div className="step-circle">{currentStep > 1 ? '✓' : '1'}</div>
                <div className="step-label">Select Property</div>
              </div>
              <div className={`step-item ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
                <div className="step-circle">{currentStep > 2 ? '✓' : '2'}</div>
                <div className="step-label">Customer Details</div>
              </div>
              <div className={`step-item ${currentStep >= 3 ? 'active' : ''}`}>
                <div className="step-circle">3</div>
                <div className="step-label">Confirm Booking</div>
              </div>
            </div>

            <div className="booking-modal-body" style={{flex: 1, overflowY: 'auto', padding: '10px 0'}}>
              
              {/* STEP 1: Select Property */}
              {currentStep === 1 && (
                <div>
                  <h3 style={{marginBottom: '15px'}}>Available Units</h3>
                  {availableProperties.length === 0 ? (
                    <div style={{padding: '30px', textAlign: 'center', background: '#f8fafc', borderRadius: '8px'}}>
                      <p>No available properties found. Please add units in Property Management.</p>
                    </div>
                  ) : (
                    <div className="property-select-grid" style={{maxHeight: 'none', overflowY: 'visible'}}>
                      {availableProperties.map(prop => (
                        <div 
                          key={prop.id} 
                          className={`property-select-card ${selectedProperty?.id === prop.id ? 'selected' : ''}`}
                          onClick={() => setSelectedProperty(prop)}
                        >
                          <div style={{fontWeight: '600', marginBottom: '4px'}}>{prop.project_name}</div>
                          <div style={{fontSize: '12px', color: '#666', marginBottom: '8px'}}>
                            {prop.building_name ? `${prop.building_name} | ` : ''}Unit: {prop.unit_number}
                          </div>
                          <div style={{fontWeight: '500', color: '#1976d2'}}>{formatPrice(prop.price)}</div>
                          <div style={{marginTop: '8px'}}>
                            <span className="status-badge status-available" style={{fontSize: '10px'}}>Available</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* STEP 2: Customer Details */}
              {currentStep === 2 && (
                <div>
                  <h3 style={{marginBottom: '15px'}}>Select Customer (Lead)</h3>
                  
                  <div style={{marginBottom: '15px'}}>
                    <input 
                      type="text" 
                      className="filter-input search" 
                      placeholder="Search by name or phone..." 
                      value={leadSearchQuery}
                      onChange={(e) => setLeadSearchQuery(e.target.value)}
                      style={{width: '100%', padding: '10px'}}
                    />
                  </div>

                  <div>
                    {filteredLeads.length === 0 ? (
                      <div style={{padding: '20px', textAlign: 'center', color: '#666'}}>No customers found.</div>
                    ) : (
                      filteredLeads.map(lead => (
                        <div 
                          key={lead.id} 
                          className={`customer-list-item ${selectedLead?.id === lead.id ? 'selected' : ''}`}
                          onClick={() => setSelectedLead(lead)}
                        >
                          <div>
                            <div style={{fontWeight: '600'}}>{lead.name}</div>
                            <div style={{fontSize: '12px', color: '#666'}}>{lead.email} | {lead.phone}</div>
                          </div>
                          <div>
                            <span className={`badge badge-${lead.stage?.toLowerCase().replace(' ', '-')}`}>{lead.stage}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* STEP 3: Confirm Booking */}
              {currentStep === 3 && (
                <div className="booking-split-view">
                  <div className="booking-panel">
                    <h3>Property Details</h3>
                    <div style={{marginTop: '10px'}}>
                      <div style={{fontWeight: '600', fontSize: '18px', marginBottom: '5px'}}>{selectedProperty.project_name}</div>
                      <div style={{color: '#666', marginBottom: '15px'}}>
                        {selectedProperty.building_name ? `${selectedProperty.building_name} | ` : ''}{selectedProperty.unit_number} | {selectedProperty.property_type}
                      </div>
                      <div style={{fontWeight: '600', fontSize: '20px', color: '#1976d2', marginBottom: '15px'}}>
                        {formatPrice(selectedProperty.price)}
                      </div>
                      <span className="status-badge status-available">Status: Available</span>
                    </div>
                  </div>
                  
                  <div className="booking-panel">
                    <h3>Customer Details</h3>
                    <div style={{marginTop: '10px'}}>
                      <div style={{marginBottom: '12px'}}>
                        <div style={{fontSize: '12px', color: '#666'}}>Name *</div>
                        <div style={{fontWeight: '500', padding: '8px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '4px', marginTop: '4px'}}>{selectedLead.name}</div>
                      </div>
                      <div style={{marginBottom: '12px'}}>
                        <div style={{fontSize: '12px', color: '#666'}}>Phone *</div>
                        <div style={{fontWeight: '500', padding: '8px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '4px', marginTop: '4px'}}>{selectedLead.phone}</div>
                      </div>
                      <div style={{marginBottom: '12px'}}>
                        <div style={{fontSize: '12px', color: '#666'}}>Email</div>
                        <div style={{fontWeight: '500', padding: '8px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '4px', marginTop: '4px'}}>{selectedLead.email}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
            <div className="modal-footer" style={{justifyContent: currentStep > 1 ? 'space-between' : 'flex-end'}}>
              {currentStep > 1 && (
                <button type="button" className="btn-outline" onClick={() => setCurrentStep(currentStep - 1)}>Back</button>
              )}
              
              {currentStep < 3 ? (
                <button type="button" className="btn-primary" onClick={handleNextStep}>Next Step</button>
              ) : (
                <button type="button" className="btn-primary" onClick={handleConfirmBooking} disabled={isSaving}>
                  {isSaving ? 'Processing...' : 'Proceed to Confirm'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="bookings-header">
        <div>
          <h1>Bookings</h1>
          <p className="subtitle">Manage property bookings and assignments</p>
        </div>
        <div style={{display: 'flex', gap: '15px', alignItems: 'center'}}>
          <SearchBox 
            value={bookingSearchQuery} 
            onChange={setBookingSearchQuery} 
            placeholder="Search by ID, Customer or Project..." 
          />
          <button className="btn-primary" onClick={openBookingFlow} style={{height: '100%'}}>+ Book Property</button>
        </div>
      </div>

      <div className="prop-metrics-grid" style={{marginBottom: '24px'}}>
        <div className="prop-metric-card">
          <div className="prop-metric-icon blue">📝</div>
          <div className="prop-metric-info">
            <span className="prop-metric-label">Total Bookings</span>
            <span className="prop-metric-value">{bookings.length}</span>
            <span className="prop-metric-subtext">All time bookings</span>
          </div>
        </div>
        
        <div className="prop-metric-card">
          <div className="prop-metric-icon green">✅</div>
          <div className="prop-metric-info">
            <span className="prop-metric-label">Confirmed</span>
            <span className="prop-metric-value">{bookings.filter(b => b.status === 'Confirmed').length}</span>
            <span className="prop-metric-subtext">Active bookings</span>
          </div>
        </div>

        <div className="prop-metric-card">
          <div className="prop-metric-icon orange">💰</div>
          <div className="prop-metric-info">
            <span className="prop-metric-label">Sales Value</span>
            <span className="prop-metric-value">
              {formatPrice(bookings.filter(b => b.status === 'Confirmed').reduce((sum, b) => sum + (Number(b.property?.price) || 0), 0))}
            </span>
            <span className="prop-metric-subtext">Confirmed revenue</span>
          </div>
        </div>

        <div className="prop-metric-card">
          <div className="prop-metric-icon purple">❌</div>
          <div className="prop-metric-info">
            <span className="prop-metric-label">Cancelled</span>
            <span className="prop-metric-value">{bookings.filter(b => b.status === 'Cancelled').length}</span>
            <span className="prop-metric-subtext">Dropped bookings</span>
          </div>
        </div>
      </div>

      <div className="bookings-content-card">
        <div className="table-responsive">
          <table className="bookings-table">
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Customer Name</th>
                <th>Project & Unit</th>
                <th>Price</th>
                <th>Booking Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="7">
                    <div className="empty-state">
                      <div className="spinner"></div>
                      <h3>Loading Bookings...</h3>
                      <p>Please wait while we fetch the latest booking records.</p>
                    </div>
                  </td>
                </tr>
              ) : filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan="7">
                    <div className="empty-state">
                      <div className="empty-state-icon">📄</div>
                      <h3>No Bookings Found</h3>
                      <p>We couldn't find any bookings matching your criteria.</p>
                      <button className="btn-primary" onClick={openBookingFlow}>+ Book Property</button>
                    </div>
                  </td>
                </tr>
              ) : (
                currentBookings.map((booking) => (
                  <tr key={booking.id}>
                    <td style={{fontWeight: '600'}}>#BKG-{booking.id.toString().padStart(4, '0')}</td>
                    <td>
                      <div style={{fontWeight: '500'}}>{booking.lead?.name || 'Unknown'}</div>
                      <div style={{fontSize: '12px', color: '#666'}}>{booking.lead?.phone || ''}</div>
                    </td>
                    <td>
                      <div style={{fontWeight: '500'}}>{booking.property?.project_name || 'Unknown'}</div>
                      <div style={{fontSize: '12px', color: '#666'}}>Unit: {booking.property?.unit_number || ''}</div>
                    </td>
                    <td className="price-text" style={{color: '#1976d2', fontWeight: '500'}}>
                      {booking.property ? formatPrice(booking.property.price) : '-'}
                    </td>
                    <td>{new Date(booking.booking_date).toLocaleDateString('en-IN')}</td>
                    <td>
                      <span className={`status-badge status-${booking.status.toLowerCase()}`}>
                        {booking.status}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn-icon" title="View Booking" onClick={() => setViewingBooking(booking)}>👁️</button>
                        <button className="btn-icon" title="Edit Status" onClick={() => setEditingBooking(booking)}>✏️</button>
                        {currentUser?.role === 'ADMIN' && (
                          <button className="btn-icon" title="Delete Booking" onClick={() => handleDeleteBooking(booking)}>🗑️</button>
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

'use client';
import { useState, useEffect } from 'react';
import './Properties.css';
import Pagination from '../../components/Pagination';
import SearchBox from '../../components/SearchBox';

export default function Properties() {
  const [properties, setProperties] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [errors, setErrors] = useState({});
  const [viewingProperty, setViewingProperty] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, data: null });
  const [currentUser, setCurrentUser] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProject, setFilterProject] = useState('All Projects');
  const [filterType, setFilterType] = useState('All Types');
  const [filterStatus, setFilterStatus] = useState('All Status');

  const [formData, setFormData] = useState({
    project_name: '',
    building_name: '',
    unit_number: '',
    property_type: 'Apartment',
    price: '',
    availability: 'Available',
    description: ''
  });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchProperties = async () => {
    const token = localStorage.getItem('token');
    try {
      setIsLoading(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}` + '/api/properties', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (!Array.isArray(data)) {
        console.warn('API returned non-array:', data);
        setProperties([]);
        if (data.error === 'Token is not valid' || data.error === 'No token, authorization denied') {
           window.location.href = '/login';
        }
        return;
      }
      setProperties(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
    const userData = localStorage.getItem('user');
    if (userData) {
      setCurrentUser(JSON.parse(userData));
    }
  }, []);

  const handleOpenModal = (property = null) => {
    if (property) {
      setEditingProperty(property.id);
      setFormData({
        project_name: property.project_name || '',
        building_name: property.building_name || '',
        unit_number: property.unit_number || '',
        property_type: property.property_type || 'Apartment',
        price: property.price || '',
        availability: property.availability || 'Available',
        description: property.description || ''
      });
    } else {
      setEditingProperty(null);
      setFormData({
        project_name: '',
        building_name: '',
        unit_number: '',
        property_type: 'Apartment',
        price: '',
        availability: 'Available',
        description: ''
      });
    }
    setErrors({});
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    // Validation
    const newErrors = {};
    if (!formData.project_name.trim()) newErrors.project_name = true;
    if (!formData.building_name.trim()) newErrors.building_name = true;
    if (!formData.unit_number.trim()) newErrors.unit_number = true;
    if (!formData.property_type) newErrors.property_type = true;
    if (!formData.price || isNaN(formData.price)) newErrors.price = true;
    if (!formData.availability) newErrors.availability = true;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showToast('Please complete all required fields correctly.', 'error');
      return;
    }

    if (isSaving) return;
    setIsSaving(true);

    const token = localStorage.getItem('token');
    const method = editingProperty ? 'PUT' : 'POST';
    const url = editingProperty ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/properties/${editingProperty}` : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}` + '/api/properties';

    try {
      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setIsModalOpen(false);
        showToast(editingProperty ? 'Property updated successfully!' : 'Property added successfully!');
        fetchProperties();
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to save property', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('An error occurred. Please try again.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (prop) => {
    setConfirmModal({
      isOpen: true,
      data: prop
    });
  };

  const executeDelete = async (id) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/properties/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        showToast('Property deleted successfully!');
        fetchProperties();
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to delete property', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('An error occurred. Please try again.', 'error');
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  };

  const filteredProperties = properties.filter(prop => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match = 
        (prop.project_name?.toLowerCase().includes(q)) || 
        (prop.building_name?.toLowerCase().includes(q)) || 
        (prop.unit_number?.toLowerCase().includes(q));
      if (!match) return false;
    }
    if (filterProject !== 'All Projects' && prop.project_name !== filterProject) return false;
    if (filterType !== 'All Types' && prop.property_type !== filterType) return false;
    if (filterStatus !== 'All Status' && prop.availability !== filterStatus) return false;
    return true;
  });

  // Pagination Logic
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const totalPages = Math.ceil(filteredProperties.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentProperties = filteredProperties.slice(startIndex, startIndex + itemsPerPage);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterProject, filterType, filterStatus]);

  const uniqueProjects = [...new Set(properties.map(p => p.project_name))].filter(Boolean);
  const uniqueTypes = [...new Set(properties.map(p => p.property_type))].filter(Boolean);

  const totalUnits = properties.length;
  const availableUnits = properties.filter(p => p.availability === 'Available').length;
  const bookedUnits = properties.filter(p => p.availability === 'Booked').length;
  const soldUnits = properties.filter(p => p.availability === 'Sold').length;

  return (
    <div className="properties-container">
      {toast && (
        <div className={`toast-message toast-${toast.type}`}>
          {toast.message}
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{maxWidth: '400px', textAlign: 'center', padding: '30px'}}>
            <div style={{fontSize: '40px', marginBottom: '15px'}}>🗑️</div>
            <h2 style={{marginBottom: '10px'}}>Delete Property</h2>
            <p style={{color: '#666', marginBottom: '25px', lineHeight: '1.5'}}>
              Are you sure you want to delete {confirmModal.data?.project_name} ({confirmModal.data?.unit_number})? This action cannot be undone.
            </p>
            <div style={{display: 'flex', gap: '15px', justifyContent: 'center'}}>
              <button className="btn-outline" onClick={() => setConfirmModal({isOpen: false, data: null})} style={{flex: 1}}>Cancel</button>
              <button 
                className="btn-danger"
                onClick={() => { executeDelete(confirmModal.data.id); setConfirmModal({isOpen: false, data: null}); }} 
                style={{flex: 1, backgroundColor: '#ef4444', borderColor: '#ef4444', color: 'white'}}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {viewingProperty && (
        <div className="modal-overlay">
          <div className="modal-content" style={{maxWidth: '500px'}}>
            <div className="modal-header">
              <h2>Property Details</h2>
              <button className="close-btn" onClick={() => setViewingProperty(null)}>×</button>
            </div>
            
            {/* Property Image Placeholder */}
            <div style={{
              width: '100%', 
              height: '180px', 
              background: 'linear-gradient(135deg, #1976d2 0%, #0d47a1 100%)',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                opacity: 0.1,
                backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)',
                backgroundSize: '20px 20px'
              }}></div>
              <div style={{
                background: 'rgba(255,255,255,0.2)',
                padding: '10px 20px',
                borderRadius: '8px',
                color: 'white',
                backdropFilter: 'blur(5px)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}>
                <span style={{ fontSize: '32px', marginBottom: '5px' }}>
                  {viewingProperty.property_type === 'Villa' ? '🏡' : viewingProperty.property_type === 'Plot' ? '🗺️' : viewingProperty.property_type === 'Commercial' ? '🏢' : '🏢'}
                </span>
                <span style={{ fontWeight: '600', letterSpacing: '1px' }}>{viewingProperty.project_name}</span>
              </div>
            </div>

            <div className="view-details-container" style={{padding: '20px'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px solid #eee'}}>
                <div>
                  <p style={{fontSize: '12px', color: '#666', marginBottom: '4px'}}>Project Name</p>
                  <p style={{fontWeight: '600', fontSize: '16px'}}>{viewingProperty.project_name}</p>
                </div>
                <div style={{textAlign: 'right'}}>
                  <p style={{fontSize: '12px', color: '#666', marginBottom: '4px'}}>Status</p>
                  <span className={`status-badge status-${viewingProperty.availability?.toLowerCase()}`}>
                    {viewingProperty.availability}
                  </span>
                </div>
              </div>

              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '15px'}}>
                <div>
                  <p style={{fontSize: '12px', color: '#666', marginBottom: '4px'}}>Building / Tower</p>
                  <p style={{fontWeight: '500'}}>{viewingProperty.building_name || '-'}</p>
                </div>
                <div>
                  <p style={{fontSize: '12px', color: '#666', marginBottom: '4px'}}>Unit Number</p>
                  <p style={{fontWeight: '500'}}>{viewingProperty.unit_number}</p>
                </div>
                <div>
                  <p style={{fontSize: '12px', color: '#666', marginBottom: '4px'}}>Property Type</p>
                  <p style={{fontWeight: '500'}}>{viewingProperty.property_type}</p>
                </div>
                <div>
                  <p style={{fontSize: '12px', color: '#666', marginBottom: '4px'}}>Price</p>
                  <p style={{fontWeight: '500', color: '#1976d2'}}>{formatPrice(viewingProperty.price)}</p>
                </div>
              </div>

              <div style={{backgroundColor: '#f5f7fa', padding: '15px', borderRadius: '8px', marginTop: '20px'}}>
                <p style={{fontSize: '12px', color: '#666', marginBottom: '8px'}}>Description & Notes</p>
                <p style={{fontSize: '14px', lineHeight: '1.5', color: '#333'}}>
                  {viewingProperty.description || 'No additional details provided for this unit.'}
                </p>
              </div>
            </div>
            <div className="modal-footer" style={{marginTop: '0'}}>
              <button className="btn-primary" onClick={() => setViewingProperty(null)} style={{width: '100%'}}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{maxWidth: '700px'}}>
            <div className="modal-header">
              <h2>{editingProperty ? 'Edit Property Unit' : 'Add Property Unit'}</h2>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleSave} noValidate>
              <div className="form-grid" style={{gridTemplateColumns: '1fr 1fr'}}>
                
                <div className="form-group">
                  <label>Project Name <span className="required">*</span></label>
                  <input className={errors.project_name ? 'error-blink' : ''} value={formData.project_name} onChange={e => {setFormData({...formData, project_name: e.target.value}); setErrors({...errors, project_name: false});}} placeholder="Enter project name" />
                </div>

                <div className="form-group">
                  <label>Building Name / Tower <span className="required">*</span></label>
                  <input className={errors.building_name ? 'error-blink' : ''} value={formData.building_name} onChange={e => {setFormData({...formData, building_name: e.target.value}); setErrors({...errors, building_name: false});}} placeholder="Enter building name" />
                </div>
                
                <div className="form-group">
                  <label>Unit Number <span className="required">*</span></label>
                  <input className={errors.unit_number ? 'error-blink' : ''} value={formData.unit_number} onChange={e => {setFormData({...formData, unit_number: e.target.value}); setErrors({...errors, unit_number: false});}} placeholder="Enter unit number" />
                </div>

                <div className="form-group">
                  <label>Property Type <span className="required">*</span></label>
                  <select className={errors.property_type ? 'error-blink' : ''} value={formData.property_type} onChange={e => {setFormData({...formData, property_type: e.target.value}); setErrors({...errors, property_type: false});}}>
                    <option value="Apartment">Apartment</option>
                    <option value="Villa">Villa</option>
                    <option value="Plot">Plot</option>
                    <option value="Commercial">Commercial</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Price (₹) <span className="required">*</span></label>
                  <div className="price-input-wrapper">
                    <input type="number" className={errors.price ? 'error-blink' : ''} value={formData.price} onChange={e => {setFormData({...formData, price: e.target.value}); setErrors({...errors, price: false});}} placeholder="Enter price" />
                  </div>
                </div>

                <div className="form-group">
                  <label>Availability Status <span className="required">*</span></label>
                  <select className={errors.availability ? 'error-blink' : ''} value={formData.availability} onChange={e => {setFormData({...formData, availability: e.target.value}); setErrors({...errors, availability: false});}}>
                    <option value="Available">Available</option>
                    <option value="Booked">Booked</option>
                    <option value="Sold">Sold</option>
                  </select>
                </div>

                <div className="form-group" style={{gridColumn: '1 / span 2'}}>
                  <label>Description</label>
                  <textarea rows="2" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Enter property details..."></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={isSaving} style={{opacity: isSaving ? 0.7 : 1, cursor: isSaving ? 'not-allowed' : 'pointer'}}>
                  {isSaving ? 'Saving...' : 'Save Unit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="properties-header">
        <div>
          <h1>Property Management</h1>
          <p className="subtitle">Manage projects, buildings, and units</p>
        </div>
        {currentUser?.role === 'ADMIN' && (
          <button className="btn-primary" onClick={() => handleOpenModal()}>+ Add Unit</button>
        )}
      </div>

      <div className="prop-metrics-grid">
        <div className="prop-metric-card interactive-card" onClick={() => setFilterStatus('All Status')} style={{cursor: 'pointer', border: filterStatus === 'All Status' ? '2px solid var(--accent-color)' : ''}}>
          <div className="prop-metric-icon blue">🏢</div>
          <div className="prop-metric-info">
            <span className="prop-metric-label">Total Units</span>
            <span className="prop-metric-value">{totalUnits}</span>
            <span className="prop-metric-subtext">across {uniqueProjects.length} projects</span>
          </div>
        </div>
        <div className="prop-metric-card interactive-card" onClick={() => setFilterStatus('Available')} style={{cursor: 'pointer', border: filterStatus === 'Available' ? '2px solid #4caf50' : ''}}>
          <div className="prop-metric-icon green">✔️</div>
          <div className="prop-metric-info">
            <span className="prop-metric-label">Available</span>
            <span className="prop-metric-value">{availableUnits}</span>
            <span className="prop-metric-subtext">{totalUnits > 0 ? Math.round((availableUnits/totalUnits)*100) : 0}% available</span>
          </div>
        </div>
        <div className="prop-metric-card interactive-card" onClick={() => setFilterStatus('Booked')} style={{cursor: 'pointer', border: filterStatus === 'Booked' ? '2px solid #ff9800' : ''}}>
          <div className="prop-metric-icon orange">📅</div>
          <div className="prop-metric-info">
            <span className="prop-metric-label">Booked</span>
            <span className="prop-metric-value">{bookedUnits}</span>
            <span className="prop-metric-subtext">{totalUnits > 0 ? Math.round((bookedUnits/totalUnits)*100) : 0}% booked</span>
          </div>
        </div>
        <div className="prop-metric-card interactive-card" onClick={() => setFilterStatus('Sold')} style={{cursor: 'pointer', border: filterStatus === 'Sold' ? '2px solid #9c27b0' : ''}}>
          <div className="prop-metric-icon purple">🏆</div>
          <div className="prop-metric-info">
            <span className="prop-metric-label">Sold</span>
            <span className="prop-metric-value">{soldUnits}</span>
            <span className="prop-metric-subtext">{totalUnits > 0 ? Math.round((soldUnits/totalUnits)*100) : 0}% sold</span>
          </div>
        </div>
      </div>

      <div className="properties-content-card">
        <div className="filters-row">
          <SearchBox 
            value={searchQuery} 
            onChange={setSearchQuery} 
            placeholder="Search projects, buildings, units..." 
          />
          
          <div className="filter-group">
            <label>Project</label>
            <select className="filter-input" value={filterProject} onChange={e => setFilterProject(e.target.value)}>
              <option value="All Projects">All Projects</option>
              {uniqueProjects.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          
          <div className="filter-group">
            <label>Property Type</label>
            <select className="filter-input" value={filterType} onChange={e => setFilterType(e.target.value)}>
              <option value="All Types">All Types</option>
              {uniqueTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          
          <div className="filter-group">
            <label>Status</label>
            <select className="filter-input" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="All Status">All Status</option>
              <option value="Available">Available</option>
              <option value="Booked">Booked</option>
              <option value="Sold">Sold</option>
            </select>
          </div>
        </div>

        <div className="table-responsive">
          <table className="properties-table">
            <thead>
              <tr>
                <th>Project Name</th>
                <th>Building / Tower</th>
                <th>Unit Number</th>
                <th>Type</th>
                <th>Price</th>
                <th>Availability</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="7">
                    <div className="empty-state">
                      <div className="spinner"></div>
                      <h3>Loading Properties...</h3>
                      <p>Please wait while we fetch the latest inventory.</p>
                    </div>
                  </td>
                </tr>
              ) : filteredProperties.length === 0 ? (
                <tr>
                  <td colSpan="7">
                    <div className="empty-state">
                      <div className="empty-state-icon">🏢</div>
                      <h3>No Properties Found</h3>
                      <p>We couldn't find any properties matching your criteria.</p>
                      {currentUser?.role === 'ADMIN' && (
                        <button className="btn-primary" onClick={() => handleOpenModal()}>+ Add Unit</button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                currentProperties.map((prop, index) => (
                  <tr key={prop.id || index}>
                    <td style={{fontWeight: '600'}}>{prop.project_name}</td>
                    <td>{prop.building_name || '-'}</td>
                    <td style={{fontWeight: '500', color: 'var(--accent-color)'}}>{prop.unit_number}</td>
                    <td>
                      <span className={`type-badge type-${prop.property_type ? prop.property_type.toLowerCase() : 'apartment'}`}>
                        {prop.property_type || 'Apartment'}
                      </span>
                    </td>
                    <td className="price-text">{formatPrice(prop.price)}</td>
                    <td>
                      <span className={`status-badge status-${prop.availability?.toLowerCase()}`}>
                        {prop.availability}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn-icon" onClick={() => setViewingProperty(prop)} title="View Details">👁️</button>
                        {currentUser?.role === 'ADMIN' && (
                          <>
                            <button className="btn-icon" onClick={() => handleOpenModal(prop)} title="Edit">✏️</button>
                            <button className="btn-icon" onClick={() => handleDelete(prop)} title="Delete">🗑️</button>
                          </>
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

import React from 'react';

export default function Pagination({ currentPage, totalPages, onPageChange }) {
  const safeTotalPages = Math.max(1, totalPages);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'var(--bg-color)', padding: '6px 12px', borderRadius: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <button 
          onClick={() => onPageChange(currentPage - 1)} 
          disabled={currentPage === 1}
          style={{ 
            background: currentPage === 1 ? 'transparent' : 'var(--accent-color)', 
            color: currentPage === 1 ? 'var(--text-secondary)' : 'white', 
            border: 'none', 
            borderRadius: '50%', 
            width: '32px', 
            height: '32px', 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            cursor: currentPage === 1 ? 'not-allowed' : 'pointer', 
            transition: 'all 0.3s ease', 
            opacity: currentPage === 1 ? 0.5 : 1 
          }}
          title="Previous"
        >
          ◀
        </button>
        <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>
          Page {currentPage} <span style={{ color: 'var(--text-secondary)', fontWeight: '400' }}>of {safeTotalPages}</span>
        </span>
        <button 
          onClick={() => onPageChange(currentPage + 1)} 
          disabled={currentPage === safeTotalPages}
          style={{ 
            background: currentPage === safeTotalPages ? 'transparent' : 'var(--accent-color)', 
            color: currentPage === safeTotalPages ? 'var(--text-secondary)' : 'white', 
            border: 'none', 
            borderRadius: '50%', 
            width: '32px', 
            height: '32px', 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            cursor: currentPage === safeTotalPages ? 'not-allowed' : 'pointer', 
            transition: 'all 0.3s ease', 
            opacity: currentPage === safeTotalPages ? 0.5 : 1 
          }}
          title="Next"
        >
          ▶
        </button>
      </div>
    </div>
  );
}

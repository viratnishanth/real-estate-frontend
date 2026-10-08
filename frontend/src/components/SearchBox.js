import React from 'react';

export default function SearchBox({ value, onChange, placeholder = "Search..." }) {
  return (
    <div style={{position: 'relative', width: '100%', maxWidth: '320px', minWidth: '250px'}}>
      <span style={{position: 'absolute', left: '12px', top: '10px', color: '#94a3b8'}}>🔍</span>
      <input 
        type="text" 
        className="filter-input" 
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{paddingLeft: '35px', width: '100%'}}
      />
    </div>
  );
}

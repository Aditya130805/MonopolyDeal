import React, { useState } from 'react';

function Card({ type, color, value, onClick }) {
  const [selected, setSelected] = useState(false);

  const styles = {
    border: `2px solid ${selected ? 'gold' : color || 'black'}`,
    borderRadius: '8px',
    padding: '10px',
    margin: '5px',
    width: '100px',
    height: '150px',
    textAlign: 'center',
    backgroundColor: '#f9f9f9',
    cursor: 'pointer',
    boxShadow: selected ? '0 0 10px gold' : '2px 2px 5px rgba(0,0,0,0.1)',
    transition: 'transform 0.2s',
    hover: {
      transform: 'scale(1.05)',
    },
  };

  const handleClick = () => {
    setSelected(!selected);
    onClick();
  };

  return (
    <div style={styles} onClick={handleClick}>
      <h4>{type}</h4>
      <p>{value ? `$${value}` : ''}</p>
    </div>
  );
}

export default Card;

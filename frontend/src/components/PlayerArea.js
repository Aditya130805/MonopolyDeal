import React from 'react';
import Card from './Card';

function PlayerArea({ name, properties, bank, hand, onCardClick }) {
  const containerStyle = {
    border: '2px solid gray',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    margin: '10px',
    padding: '15px',
    width: '300px',
    boxShadow: '2px 2px 5px rgba(0,0,0,0.1)',
  };

  return (
    <div style={containerStyle}>
      <h3>{name}</h3>
      <div>
        <h4>Properties:</h4>
        <div style={{ display: 'flex', gap: '5px' }}>
          {properties.map((card, index) => (
            <Card
              key={index}
              {...card}
              onClick={() => onCardClick('properties', index, card)}
            />
          ))}
        </div>
      </div>
      <div>
        <h4>Bank:</h4>
        <div style={{ display: 'flex', gap: '5px' }}>
          {bank.map((card, index) => (
            <Card
              key={index}
              {...card}
              onClick={() => onCardClick('bank', index, card)}
            />
          ))}
        </div>
      </div>
      <div>
        <h4>Hand:</h4>
        <div style={{ display: 'flex', gap: '5px' }}>
          {hand.map((card, index) => (
            <Card
              key={index}
              {...card}
              onClick={() => onCardClick('hand', index, card)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default PlayerArea;

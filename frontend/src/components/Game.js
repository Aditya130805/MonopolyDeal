import React from 'react';
import GameBoard from './GameBoard';
import PlayerArea from './PlayerArea';

function Game({ currentTurn, eventLog, players, onCardClick }) {
  return (
    <div>
      <GameBoard currentTurn={currentTurn} eventLog={eventLog} />
      
      <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
        {players.map((player, index) => (
          <PlayerArea
            key={index}
            name={player.name}
            properties={player.properties}
            bank={player.bank}
            hand={player.hand}
            onCardClick={(cardType, cardIndex, card) => onCardClick(index, cardType, cardIndex)}
          />
        ))}
      </div>
    </div>
  );
}

export default Game;

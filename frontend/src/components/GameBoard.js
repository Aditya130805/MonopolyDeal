import React from 'react';

function GameBoard({ currentTurn, eventLog }) {
  return (
    <div>
      <h2>Current Turn: {currentTurn}</h2>
      <div>
        <h4>Event Log:</h4>
        <ul>
          {eventLog.map((log, index) => (
            <li key={index}>{log}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default GameBoard;

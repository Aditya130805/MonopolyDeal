import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useWebSocket } from '../contexts/WebSocketContext';
import { useAuth } from '../contexts/AuthContext';
import Navbar from './auth/Navbar';
import MoneyCard from './cards/MoneyCard';
import PropertyCard from './cards/PropertyCard';
import ActionCard from './cards/ActionCard';
import BankAndCards from './game/BankAndCards';
import PropertySet from './game/PropertySet';
import GameCenter from './game/GameCenter';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

const MainGame = () => {  
  const { roomId } = useParams();
  const { socket } = useWebSocket();
  const { user } = useAuth();
  const [hoveredCard, setHoveredCard] = useState(null);
  const [isSocketReady, setIsSocketReady] = useState(false);
  const [playerHand, setPlayerHand] = useState([]);
  const [playerBank, setPlayerBank] = useState([]);
  const [playerProperties, setPlayerProperties] = useState({});
  const [opponentHand, setOpponentHand] = useState([]);
  const [opponentBank, setOpponentBank] = useState([]);
  const [opponentProperties, setOpponentProperties] = useState({});
  const [numCardsInDrawPile, setNumCardsInDrawPile] = useState([]);
  const [lastAction, setLastAction] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  // CONSTANTS
  const colorOrder = ['brown', 'mint', 'blue', 'light blue', 'pink', 'orange', 'red', 'yellow', 'green', 'black']
  const setRequirements = {
    'brown': 2, 'mint': 2, 'blue': 2,
    'light blue': 3, 'pink': 3, 'orange': 3, 'red': 3, 'yellow': 3, 'green': 3,
    'black': 4
  };
  const ItemTypes = {
    CARD: 'card'
  };

  // SOCKET HANDLING
  
  useEffect(() => {
    if (!socket) {
        console.log("Socket is null; waiting for WebSocket connection.");
        return;
    }
    console.log("(Socket 2) Connected:", socket);
    socket.onmessage = handleMessage;
    setTimeout(() => setIsSocketReady(true), 0);
  }, [socket]);

  useEffect(() => {
    if (isSocketReady) {
      socket.send(JSON.stringify({
        action: 'initial_game_state',
        player_name: user.username
      }));
    }
  }, [isSocketReady]);

  const handleMessage = (event) => {
    try {
      console.log(`(Handler 2) WebSocket message in room ${roomId}:`, event.data);
      const data = JSON.parse(event.data);
      if (data.type && data.type === 'game_update') {
        const gameState = data.state;
        console.log("STATE:", gameState);
        
        // Find current player and update their hand
        console.log(gameState.players);
        const currentPlayer = gameState.players.find(p => p.id === user.unique_id);
        if (currentPlayer) {
          setPlayerHand(currentPlayer.hand);
          setPlayerBank(currentPlayer.bank);
          setPlayerProperties(currentPlayer.properties);
        }
        // Find opponents and update their hands
        const opponents = gameState.players.filter(p => p.id !== user.unique_id);
        const opponentCards = opponents.flatMap(opponent => opponent.hand);
        const opponentBanks = opponents.flatMap(opponent => opponent.bank);
        const opponentProperties = opponents.flatMap(opponent => opponent.properties);
        setOpponentHand(opponentCards);
        setOpponentBank(opponentBanks);
        setOpponentProperties(opponentProperties);
        setNumCardsInDrawPile(gameState.deck_count);
        setLastAction(gameState.discard_pile ? gameState.discard_pile[gameState.discard_pile.length - 1] : null);
      }
    } catch (error) {
      console.error("Error parsing WebSocket message:", error);
    }
  };

  const DraggableCard = ({ card, children }) => {
    const [{ isDragging }, drag] = useDrag(() => ({
      type: ItemTypes.CARD,
      item: { card },
      collect: (monitor) => ({
        isDragging: monitor.isDragging()
      })
    }));

    return (
      <div 
        ref={drag}
        className={`relative ${isDragging ? 'opacity-100' : ''} transform: translateZ(0)`}
      >
        {children}
      </div>
    );
  };

  const handleCardDrop = (card) => {
    if (card.type === 'money') {
      socket.send(JSON.stringify({
        action: 'play_money',
        card_id: card.id
      }));
    } else if (card.type === 'property') {
      socket.send(JSON.stringify({
        action: 'play_property',
        card_id: card.id
      }));
    } else if (card.type === 'action') {
      socket.send(JSON.stringify({
        action: 'play_action',
        card_id: card.id
      }));
    }
  };

  const renderCardContent = (card) => {
    switch (card.type) {
      case 'money':
        return <MoneyCard value={card.value} />;
      case 'property':
        return (
          <PropertyCard
            name={card.name}
            color={card.color}
            value={card.value}
            rent={card.rent}
            isWild={card.isWild}
          />
        );
      case 'action':
        return (
          <ActionCard
            key={card.id}
            name={card.name}
            rentColors={card.rentColors || []}
          />
        );
      default:
        return (
          <div className="w-[160px] h-[220px] bg-white border-2 border-gray-700 rounded-lg shadow-md 
            flex flex-col justify-center items-center">
            <div className="font-semibold mb-2">{card.type}</div>
            <div>{card.value}</div>
          </div>
        );
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        
        {/* Game Layout */}
        <div className="flex flex-col justify-between h-[calc(100vh-4rem)] py-32 px-8 overflow-hidden bg-gray-200">
          {/* Opponent's Area */}
          <div className="w-full">
            <BankAndCards 
              hand={opponentHand}
              bank={opponentBank}
              isOpponent={true}
              ItemTypes={ItemTypes}
              handleCardDrop={handleCardDrop}
              DraggableCard={DraggableCard}
              renderCardContent={renderCardContent}
            />
          </div>

          {/* Center Area with Property Sets */}
          <div className="w-full flex justify-between items-center gap-6">
            {/* Left Property Set */}
            <div className="flex-1">
              <PropertySet 
                properties={playerProperties}
                isOpponent={false}
                setRequirements={setRequirements}
                colorOrder={colorOrder}
              />
            </div>

            {/* Center Action Area */}
            <GameCenter 
              numCardsInDrawPile={numCardsInDrawPile}
              lastAction={lastAction}
              renderCardContent={renderCardContent}
            />

            {/* Right Property Set */}
            <div className="flex-1">
              <PropertySet 
                properties={opponentProperties}
                isOpponent={true}
                setRequirements={setRequirements}
                colorOrder={colorOrder}
              />
            </div>
          </div>
          
          {/* Player's Area */}
          <div className="w-full">
            <BankAndCards 
              hand={playerHand}
              bank={playerBank}
              isOpponent={false}
              ItemTypes={ItemTypes}
              handleCardDrop={handleCardDrop}
              DraggableCard={DraggableCard}
              renderCardContent={renderCardContent}
            />
          </div>
        </div>
      </div>
    </DndProvider>
  );
};

export default MainGame;

import React, { Suspense } from 'react';

// Lazy load all overlays
const DealBreakerOverlay = React.lazy(() => import('./overlays/DealBreakerOverlay'));
const JustSayNoChoiceWaitingOverlay = React.lazy(() => import('./overlays/JustSayNoChoiceWaitingOverlay'));
const JustSayNoPlayedOverlay = React.lazy(() => import('./overlays/JustSayNoPlayedOverlay'));
const PaymentSuccessfulOverlay = React.lazy(() => import('./overlays/PaymentSuccessfulOverlay'));
const PropertyStealOverlay = React.lazy(() => import('./overlays/PropertyStealOverlay'));
const PropertySwapOverlay = React.lazy(() => import('./overlays/PropertySwapOverlay'));
const RentCollectionOverlay = React.lazy(() => import('./overlays/RentCollectionOverlay'));
const TieOverlay = React.lazy(() => import('./overlays/TieOverlay'));
const WinnerOverlay = React.lazy(() => import('./overlays/WinnerOverlay'));

// Loading fallback component with minimal UI
const LoadingFallback = () => (
  <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center">
    <div className="bg-white p-4 rounded-lg shadow-lg">
      <div className="animate-spin w-6 h-6 border-2 border-gray-900 border-t-transparent rounded-full"></div>
    </div>
  </div>
);

const GameOverlays = ({
  // Property Steal Overlay props
  propertyStealOverlayData,
  setPropertyStealOverlayData,

  // Property Swap Overlay props
  propertySwapOverlayData,
  setPropertySwapOverlayData,
  
  // Deal Breaker Overlay props
  dealBreakerOverlayData,
  setDealBreakerOverlayData,

  // Rent Collection Overlay props
  rentCollectionOverlayData,
  setRentCollectionOverlayData,

  // Payment Successful Overlay props
  paymentSuccessfulOverlayData,
  setPaymentSuccessfulOverlayData,

  // Just Say No Choice Waiting Overlay props
  justSayNoChoiceWaitingOverlayData,
  setJustSayNoChoiceWaitingOverlayData,

  // Just Say No Played Overlay props
  justSayNoPlayedOverlayData,
  setJustSayNoPlayedOverlayData,

  // Tie Overlay props
  tieOverlayData,
  setTieOverlayData,

  // Winner Overlay props
  winnerOverlayData,
  setWinnerOverlayData,
}) => {
  return (
    <>
      <Suspense fallback={<LoadingFallback />}>
        {/* Done */}
        <PropertyStealOverlay
          isVisible={propertyStealOverlayData.isVisible}
          onClose={() => setPropertyStealOverlayData(prev => ({ ...prev, isVisible: false, gameState: null, property: null, stealerId: "", targetId: "" }))}
          overlayData={propertyStealOverlayData}
        />

        {/* Done */}
        <PropertySwapOverlay
          isVisible={propertySwapOverlayData.isVisible}
          onClose={() => setPropertySwapOverlayData({ isVisible: false, gameState: null, property1: null, property2: null, player1Id: "", player2Id: "" })}
          overlayData={propertySwapOverlayData}
        />

        {/* Done */}
        <DealBreakerOverlay
          isVisible={dealBreakerOverlayData.isVisible}
          onClose={() => setDealBreakerOverlayData({ isVisible: false, gameState: null, stealerId: '', targetId: '', color: '', propertySet: [] })}
          overlayData={dealBreakerOverlayData}
        />

        {/* Done */}
        <RentCollectionOverlay
          isVisible={rentCollectionOverlayData.isVisible}
          onClose={() => setRentCollectionOverlayData({ isVisible: false })}
          overlayData={rentCollectionOverlayData}
        />

        {/* Done  */}
        <PaymentSuccessfulOverlay
          isVisible={paymentSuccessfulOverlayData.isVisible}
          onClose={() => setPaymentSuccessfulOverlayData({ isVisible: false, playerId: '', targetId: '', selectedCards: [] })}
          overlayData={paymentSuccessfulOverlayData}
        />

        {/* Done */}
        <JustSayNoChoiceWaitingOverlay
          isVisible={justSayNoChoiceWaitingOverlayData.isVisible}
          onClose={() => setJustSayNoChoiceWaitingOverlayData({ isVisible: false, gameState: null, playerId: '' })}
          overlayData={justSayNoChoiceWaitingOverlayData}
        />

        <JustSayNoPlayedOverlay
          isVisible={justSayNoPlayedOverlayData.isVisible}
          onClose={() => setJustSayNoPlayedOverlayData({ isVisible: false, playerId: '', opponentId: '', againstCard: null, justSayNoCard: null })}
          overlayData={justSayNoPlayedOverlayData}
        />

        {/* Done */}
        <TieOverlay
          isVisible={tieOverlayData.isVisible}
          onClose={() => setTieOverlayData({ isVisible: false })}
          overlayData={tieOverlayData}
        />

        {/* Done */}
        <WinnerOverlay
          isVisible={winnerOverlayData.isVisible}
          onClose={() => setWinnerOverlayData({ isVisible: false, winner: '' })}
          overlayData={winnerOverlayData}
        />
      </Suspense>
    </>
  );
};

export default GameOverlays;

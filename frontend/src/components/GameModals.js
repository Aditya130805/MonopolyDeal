import React from 'react';
import RentModal from './modals/RentModal';
import SlyDealModal from './modals/SlyDealModal';
import ForcedDealModal from './modals/ForcedDealModal';
import DealBreakerModal from './modals/DealBreakerModal';
import JustSayNoModal from './modals/JustSayNoModal';

const GameModals = ({
  // Rent Modal props
  rentModalOpen,
  setRentModalOpen,
  rentModalData,
  handleRentPayment,
  
  // Sly Deal Modal props
  slyDealModalOpen,
  setSlyDealModalData,
  slyDealModalData,
  handleSlyDealPropertySelect,
  
  // Forced Deal Modal props
  forcedDealModalOpen,
  setForcedDealModalData,
  forcedDealModalData,
  handleForcedDealPropertySelect,
  
  // Deal Breaker Modal props
  dealBreakerModalOpen,
  setDealBreakerModalData,
  dealBreakerModalData,
  handleDealBreakerPropertySetSelect,
  
  // Just Say No Modal props
  justSayNoModalOpen,
  setJustSayNoModalOpen,
  justSayNoModalData,
  handleJustSayNoResponse
}) => {
  return (
    <>
      <RentModal
        isOpen={rentModalOpen}
        onClose={() => setRentModalOpen(false)}
        // modalData={rentModalData}
        amountDue={rentModalData?.amountDue}
        recipientName={rentModalData?.recipientName}
        rentType={rentModalData?.rentType}
        playerBank={rentModalData?.playerBank}
        playerProperties={rentModalData?.playerProperties}
        onPaymentSubmit={handleRentPayment}
      />

      <SlyDealModal
        isOpen={slyDealModalOpen}
        onClose={() => setSlyDealModalData(prev => ({ ...prev, isVisible: false }))}
        modalData={slyDealModalData}
        onPropertySelect={handleSlyDealPropertySelect}
      />

      <ForcedDealModal
        isOpen={forcedDealModalOpen}
        onClose={() => setForcedDealModalData(prev => ({ ...prev, isVisible: false }))}
        modalData={forcedDealModalData}
        onPropertySelect={handleForcedDealPropertySelect}
      />

      <DealBreakerModal
        isOpen={dealBreakerModalOpen}
        onClose={() => setDealBreakerModalData(prev => ({ ...prev, isVisible: false }))}
        modalData={dealBreakerModalData}
        onPropertySetSelect={handleDealBreakerPropertySetSelect}
      />

      <JustSayNoModal
        isOpen={justSayNoModalOpen}
        onClose={() => setJustSayNoModalOpen(false)}
        modalData={justSayNoModalData}
        onResponse={handleJustSayNoResponse}
      />
    </>
  );
};

export default GameModals;

import React, { Suspense } from 'react';

// Lazy load all modals
const RentModal = React.lazy(() => import('./modals/RentModal'));
const SlyDealModal = React.lazy(() => import('./modals/SlyDealModal'));
const ForcedDealModal = React.lazy(() => import('./modals/ForcedDealModal'));
const DealBreakerModal = React.lazy(() => import('./modals/DealBreakerModal'));
const JustSayNoModal = React.lazy(() => import('./modals/JustSayNoModal'));
const DoubleRentModal = React.lazy(() => import('./modals/DoubleRentModal'));

// Loading fallback component with minimal UI
const LoadingFallback = () => (
  <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center">
    <div className="bg-white p-4 rounded-lg shadow-lg">
      <div className="animate-spin w-6 h-6 border-2 border-gray-900 border-t-transparent rounded-full"></div>
    </div>
  </div>
);

const GameModals = ({
  // Rent Modal props
  rentModalOpen,
  setRentModalData,
  rentModalData,
  handleRentPayment,

  // Double Rent Modal props
  doubleRentModalOpen,
  doubleRentModalData,
  setDoubleRentModalData,
  handleDoubleRentResponse,
  
  // Sly Deal Modal props
  slyDealModalOpen,
  slyDealModalData,
  setSlyDealModalData,
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
  setJustSayNoModalData,
  justSayNoModalData,
  handleJustSayNoResponse
}) => {
  return (
    <>
      <Suspense fallback={<LoadingFallback />}>
        <RentModal
          isOpen={rentModalOpen}
          onClose={() => setRentModalData(prev => ({ ...prev, isVisible: false }))}
          modalData={rentModalData}
          onPaymentSubmit={handleRentPayment}
        />
      </Suspense>

      <Suspense fallback={<LoadingFallback />}>
        <DoubleRentModal
          isOpen={doubleRentModalOpen}
          onClose={() => setDoubleRentModalData(prev => ({ ...prev, isVisible: false }))}
          modalData={doubleRentModalData}
          onResponse={handleDoubleRentResponse}
        />
      </Suspense>

      <Suspense fallback={<LoadingFallback />}>
        <SlyDealModal
          isOpen={slyDealModalOpen}
          onClose={() => setSlyDealModalData(prev => ({ ...prev, isVisible: false }))}
          modalData={slyDealModalData}
          onPropertySelect={handleSlyDealPropertySelect}
        />
      </Suspense>

      <Suspense fallback={<LoadingFallback />}>
        <ForcedDealModal
          isOpen={forcedDealModalOpen}
          onClose={() => setForcedDealModalData(prev => ({ ...prev, isVisible: false }))}
          modalData={forcedDealModalData}
          onPropertySelect={handleForcedDealPropertySelect}
        />
      </Suspense>

      <Suspense fallback={<LoadingFallback />}>
        <DealBreakerModal
          isOpen={dealBreakerModalOpen}
          onClose={() => setDealBreakerModalData(prev => ({ ...prev, isVisible: false }))}
          modalData={dealBreakerModalData}
          onPropertySetSelect={handleDealBreakerPropertySetSelect}
        />
      </Suspense>

      <Suspense fallback={<LoadingFallback />}>
        <JustSayNoModal
          isOpen={justSayNoModalOpen}
          onClose={() => setJustSayNoModalData(prev => ({ ...prev, isVisible: false }))}
          modalData={justSayNoModalData}
          onResponse={handleJustSayNoResponse}
        />
      </Suspense>
    </>
  );
};

export default GameModals;

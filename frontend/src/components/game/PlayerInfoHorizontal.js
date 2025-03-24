import React, { useState } from 'react';
import { HomeIcon, BanknotesIcon, Square2StackIcon, UserIcon } from '@heroicons/react/24/outline';
import PropertySet from './PropertySet';

const PlayerInfoHorizontal = ({ player, color = 'gray', isFourPlayer = false }) => {
    const [showBankDetails, setShowBankDetails] = useState(false);
    
    // Bank calculations
    const moneyCards = player?.bank || [];
    const denominations = [1, 2, 3, 4, 5, 10];
    
    // Initialize counts object
    const counts = {};
    for (const val of denominations) {
        counts[val] = 0;
        for (const card of moneyCards) {
            if (card.value === val) {
                counts[val]++;
            }
        }
    }
    const total = moneyCards.reduce((sum, card) => sum + card.value, 0);

    return (
        <div className={`w-full max-w-[375px] bg-white rounded-lg shadow-lg overflow-hidden`}>
            {/* Username Panel */}
            <div className={`w-full px-3 py-1 bg-${color}-100 border-b border-${color}-200 flex items-center gap-2`}>
                <div className={`p-1 bg-${color}-50 rounded-md`}>
                    <UserIcon className={`w-4 h-4 text-${color}-600`} />
                </div>
                <h2 className={`flex-1 font-semibold text-${color}-700 truncate`}>
                    {player?.name || 'Unknown'}
                </h2>
                
                {/* Hand Count */}
                <div className={`bg-${color}-50 rounded-md px-2 py-1 border border-${color}-100 flex items-center justify-between mr-2`}>
                    <div className="flex items-center gap-1.5">
                        <Square2StackIcon className={`w-4 h-4 text-${color}-600`} />
                        <span className={`text-xs font-medium text-${color}-600 uppercase`}>Hand</span>
                    </div>
                    <span className={`text-sm font-medium text-${color}-700 ml-2`}>{player?.hand?.length || 0}</span>
                </div>
                
                {/* Bank Amount */}
                <div
                    id={`bank-${player?.id}`}
                    className={`bg-${color}-50 rounded-md px-2 py-1 border border-${color}-100 flex items-center justify-between relative cursor-pointer hover:bg-${color}-100 transition-colors`}
                    onMouseEnter={() => setShowBankDetails(true)}
                    onMouseLeave={() => setShowBankDetails(false)}
                >
                    <div className="flex items-center gap-1.5">
                        <BanknotesIcon className={`w-4 h-4 text-${color}-600`} />
                        <span className={`text-xs font-medium text-${color}-600 uppercase`}>Bank</span>
                    </div>
                    <span className={`text-sm font-medium text-${color}-700 ml-2`}>${total}M</span>

                    {/* Hover Popup */}
                    {showBankDetails && (
                        <div className="absolute top-full right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 p-3 min-w-[140px] z-50">
                            {/* Arrow */}
                            <div className="absolute -top-2 right-4 w-3 h-3 bg-white transform rotate-45 border-t border-l border-gray-200"></div>
                            
                            <div className="relative">
                                {/* Grid of denominations */}
                                <div className="grid grid-cols-2 gap-1.5">
                                    {denominations.map(value => (
                                        <div 
                                            key={value}
                                            className={`rounded-md p-1.5 ${
                                                counts[value] > 0 
                                                    ? `bg-${color}-50 ring-1 ring-${color}-200` 
                                                    : 'bg-gray-50'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className={`text-xs font-medium ${counts[value] > 0 ? `text-${color}-700` : 'text-gray-400'}`}>
                                                    ${value}M
                                                </span>
                                                <span className={`text-xs ${counts[value] > 0 ? `text-${color}-600` : 'text-gray-400'}`}>
                                                    ×{counts[value]}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            
            {/* Content Section */}
            <div className={`${isFourPlayer ? 'p-1.5' : 'p-2.5'}`}>
                <div className="relative">
                    <div className={`bg-${color}-50 rounded-lg ${isFourPlayer ? 'p-1.5' : 'p-2'} border border-${color}-100`}>
                        <div className="flex items-stretch justify-center">
                            {/* House Icon Strip - vertical strip to the left */}
                            <div className="relative -mr-1 flex items-center">
                                <div className={`w-6 h-full bg-${color}-200 rounded-l-lg`}></div>
                                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                                    <HomeIcon className={`w-4 h-4 text-${color}-600`} />
                                </div>
                            </div>
                            
                            <PropertySet
                                properties={player?.properties || {}}
                                playerId={player?.id}
                                setsPerRow={6}
                                isCompact={true}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlayerInfoHorizontal;
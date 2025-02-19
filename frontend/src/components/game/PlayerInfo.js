import React, { useState } from 'react';
import { HomeIcon, BanknotesIcon, Square2StackIcon, UserIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline';
import PropertySet from './PropertySet';

const PlayerInfo = ({ player, color = 'gray' }) => {
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
        <div className={`w-full max-w-xs bg-white rounded-lg shadow-lg overflow-hidden`}>
            {/* Username Panel */}
            <div className={`w-full px-3 py-2 bg-${color}-100 border-b border-${color}-200 flex items-center gap-2`}>
                <div className={`p-1 bg-${color}-50 rounded-md`}>
                    <UserIcon className={`w-4 h-4 text-${color}-600`} />
                </div>
                <h2 className={`flex-1 font-semibold text-${color}-700 truncate`}>
                    {player?.name || 'Unknown'}
                </h2>
            </div>

            {/* Content Section */}
            <div className="p-2.5">
                {/* Stats Row */}
                <div className="flex items-center justify-between w-full mb-2">
                    {/* Hand Count */}
                    <div className={`flex-1 bg-${color}-50 rounded-md px-2 py-1 border border-${color}-100 flex items-center justify-between mr-1`}>
                        <div className="flex items-center gap-1.5">
                            <Square2StackIcon className={`w-4 h-4 text-${color}-600`} />
                            <span className={`text-xs font-medium text-${color}-600 uppercase`}>Hand</span>
                        </div>
                        <span className={`text-sm font-medium text-${color}-700`}>{player?.hand?.length || 0}</span>
                    </div>
                    {/* Bank Amount */}
                    <div 
                        className={`flex-1 bg-${color}-50 rounded-md px-2 py-1 border border-${color}-100 flex items-center justify-between ml-1 relative cursor-pointer hover:bg-${color}-100 transition-colors`}
                        onMouseEnter={() => setShowBankDetails(true)}
                        onMouseLeave={() => setShowBankDetails(false)}
                    >
                        <div className="flex items-center gap-1.5">
                            <BanknotesIcon className={`w-4 h-4 text-${color}-600`} />
                            <span className={`text-xs font-medium text-${color}-600 uppercase`}>Bank</span>
                        </div>
                        <span className={`text-sm font-medium text-${color}-700`}>${total}M</span>

                        {/* Hover Popup */}
                        {showBankDetails && (
                            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 p-3 min-w-[140px] z-50">
                                {/* Arrow */}
                                <div className="absolute -top-2 left-4 w-3 h-3 bg-white transform rotate-45 border-t border-l border-gray-200"></div>
                                
                                <div className="relative">
                                    {/* Header */}
                                    {/* <div className="flex items-center gap-2 mb-2">
                                        <div className={`p-1 bg-${color}-50 rounded-md`}>
                                            <ArrowTrendingUpIcon className={`w-3.5 h-3.5 text-${color}-600`} />
                                        </div>
                                        <h3 className="text-sm font-semibold text-gray-800">Bank</h3>
                                        <div className="ml-auto">
                                            <span className={`text-sm font-bold text-${color}-600`}>${total}M</span>
                                        </div> */}
                                    {/* </div> */}
                                    
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

                {/* Property Section */}
                <div className={`bg-${color}-50 rounded-lg p-2 border border-${color}-100`}>
                    <div className="flex items-center gap-1.5 mb-1.5">
                        <HomeIcon className={`w-3.5 h-3.5 text-${color}-600/70`} />
                        <span className={`text-xs font-medium text-${color}-600 uppercase tracking-wider`}>Properties</span>
                    </div>
                    
                    <PropertySet
                        properties={player?.properties || {}}
                        setsPerRow={4}
                        isCompact={true}
                    />
                </div>
            </div>
        </div>
    );
};

export default PlayerInfo;

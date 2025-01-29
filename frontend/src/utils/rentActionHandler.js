const colorStyles = {
    'brown': '#92400E',
    'light blue': '#7DD3FC',
    'pink': '#F9A8D4',
    'orange': '#FB923C',
    'red': '#EF4444',
    'yellow': '#FDE047',
    'green': '#16A34A',
    'blue': '#2563EB',
    'black': '#1F2937',
    'mint': '#A7F3D0'
};

const rents = {
    'brown': [1, 2], 'mint': [1, 2], 'blue': [3, 8],
    'light blue': [1, 2, 3], 'pink': [1, 2, 4], 'orange': [1, 3, 5], 'red': [2, 3, 6], 'yellow': [2, 4, 6], 'green': [2, 4, 7],
    'black': [1, 2, 3, 4]
}

const handleRentColorSelection = (card, playerProperties, playerHand, actionsRemaining, socket, user, setRentAmount, setDoubleRentAmount, setShowActionAnimation, setPendingRentCard, setShowDoubleRentOverlay, onColorSelect) => {
    // Create full-screen overlay
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0)';
    overlay.style.zIndex = '9998';
    document.body.appendChild(overlay);

    const colorButtons = document.createElement('div');

    console.log("Player properties:", playerProperties);
    
    // Function to update position
    const updatePosition = () => {
        // Find the action pile in the game center
        const actionPiles = document.querySelectorAll('.relative');
        const actionPile = Array.from(actionPiles).find(el => {
            const actionCard = el.querySelector('.w-\\[140px\\].h-\\[190px\\]');
            return actionCard !== null;
        });
        if (!actionPile || !colorButtons) return;
        const rect = actionPile.getBoundingClientRect();
        colorButtons.style.position = 'fixed';
        colorButtons.style.top = rect.top + 'px';
        colorButtons.style.left = rect.left + 'px';
        colorButtons.style.width = rect.width + 'px';
        colorButtons.style.height = rect.height + 'px';
    };

    // Initial position
    updatePosition();
    
    // Add resize listener
    const resizeObserver = new ResizeObserver(updatePosition);
    const actionPiles = document.querySelectorAll('.relative');
    const actionPile = Array.from(actionPiles).find(el => {
        const actionCard = el.querySelector('.w-\\[140px\\].h-\\[190px\\]');
        return actionCard !== null;
    });
    if (actionPile) {
        resizeObserver.observe(actionPile);
    }
    window.addEventListener('resize', updatePosition);
    
    // Style the color buttons container
    colorButtons.style.backgroundColor = 'transparent';
    colorButtons.style.display = 'flex';
    colorButtons.style.flexDirection = 'column';
    colorButtons.style.borderRadius = '8px';
    colorButtons.style.overflow = 'hidden';
    colorButtons.style.zIndex = '9999';
    
    // Get valid colors based on player's properties
    const validColors = card.rentColors.filter(rentColor => {
        for (let [color, cards] of Object.entries(playerProperties)) {
            if (color.toLowerCase() === rentColor.toLowerCase()) {
                return cards.some(c => c.type === 'property');
            }
        }
        return false;
    });

    const set_requirements = {
        'brown': 2, 'mint': 2, 'blue': 2,
        'light blue': 3, 'pink': 3, 'orange': 3, 
        'red': 3, 'yellow': 3, 'green': 3,
        'black': 4
    };

    // Calculate rent for each color
    const rentAmounts = {};
    validColors.forEach(rentColor => {
        let totalRent = 0;
        const properties = playerProperties[rentColor] || [];
        
        // Count number of properties
        const propertyCount = properties.filter(c => c.type === 'property').length;
        
        // Check for house and hotel
        const hasHouse = properties.some(c => c.type === 'action' && c.name.toLowerCase() === 'house');
        const hasHotel = properties.some(c => c.type === 'action' && c.name.toLowerCase() === 'hotel');
        totalRent = rents[rentColor][Math.min(propertyCount - 1, rents[rentColor].length - 1)];
        
        // Add house and hotel bonuses if it's a full set
        if (hasHouse) totalRent += 3;
        if (hasHotel) totalRent += 4;
        
        rentAmounts[rentColor] = totalRent;
    });

    // Create split sections for each valid color
    validColors.forEach((color) => {
        const section = document.createElement('div');
        section.style.flex = `1`;
        section.style.backgroundColor = colorStyles[color];
        section.style.opacity = '0.8';
        section.style.cursor = 'pointer';
        section.style.position = 'relative';
        section.style.transition = 'opacity 0.2s ease';
        
        // Add color label
        const label = document.createElement('div');
        label.textContent = `${color}`;
        // label.textContent = `${color} (${rentAmounts[color]}M)`;
        label.style.position = 'absolute';
        label.style.left = '50%';
        label.style.top = '50%';
        label.style.transform = 'translate(-50%, -50%)';
        label.style.color = ['yellow', 'mint', 'light blue'].includes(color) ? '#1F2937' : 'white';
        label.style.fontSize = '0.875rem';
        label.style.fontWeight = '600';
        label.style.textTransform = 'capitalize';
        label.style.textShadow = ['yellow', 'mint', 'light blue'].includes(color) ? 'none' : '0 1px 2px rgba(0,0,0,0.2)';
        label.style.pointerEvents = 'none';
        
        section.appendChild(label);
        
        section.onmouseover = () => {
            section.style.opacity = '0.95';
        };
        
        section.onmouseout = () => {
            section.style.opacity = '0.85';
        };
        
        section.onclick = () => {
            section.style.opacity = '1';
            onColorSelect(color, rentAmounts[color]);
            resizeObserver.disconnect();
            window.removeEventListener('resize', updatePosition);
            document.body.removeChild(colorButtons);
            document.body.removeChild(overlay);
        };
        
        colorButtons.appendChild(section);
    });
    
    document.body.appendChild(colorButtons);
};

export { handleRentColorSelection };

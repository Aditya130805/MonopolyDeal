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

export const handleHousePlacement = (card, playerProperties, setError, socket, user, setRequirements, mainSets, overflowSets) => {

  let completeSets = [];

  // First find complete sets in mainSets that don't have a house
  Object.entries(mainSets).forEach(([color, cards]) => {
    if (color.toLowerCase() == 'black' || color.toLowerCase() == 'mint') {
      return;
    }

    const propertyCards = cards.filter(c => c.type === 'property');
    const hasHouse = cards.some(c => c.type === 'action' && c.name.toLowerCase() === 'house');
    const isComplete = propertyCards.length >= setRequirements[color];
    
    if (isComplete && !hasHouse) {
      // Complete set without house - add to completeSets
      completeSets.push([color, cards]);
    } else if (isComplete && hasHouse) {
      // Complete set with house - check overflow
      const overflowCards = overflowSets[color] || [];
      const overflowPropertyCards = overflowCards.filter(c => c.type === 'property');
      const overflowHasHouse = overflowCards.some(c => c.type === 'action' && c.name.toLowerCase() === 'house');
      
      if (overflowPropertyCards.length >= setRequirements[color] && !overflowHasHouse) {
        completeSets.push([color, overflowPropertyCards]);
      }
    }
  });
  
  if (completeSets.length === 0) {
    setError('No valid property sets to add a house to');
    return;
  }

  // Create color selection buttons
  const colorButtons = document.createElement('div');
  
  // Function to update position
  const updatePosition = () => {
    const propertySet = document.querySelector('.property-set');
    if (!propertySet || !colorButtons) return;
    const rect = propertySet.getBoundingClientRect();
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
  resizeObserver.observe(document.querySelector('.property-set'));
  window.addEventListener('resize', updatePosition);
  
  colorButtons.style.backgroundColor = 'transparent';
  colorButtons.style.display = 'flex';
  colorButtons.style.flexDirection = 'column';
  colorButtons.style.borderRadius = '8px';
  colorButtons.style.overflow = 'hidden';
  colorButtons.style.zIndex = '1000';
  
  // Create split sections for each complete set
  completeSets.forEach(([color, _], index) => {
    const section = document.createElement('div');
    section.style.flex = `1`;
    section.style.backgroundColor = colorStyles[color];
    section.style.opacity = '0.8';
    section.style.cursor = 'pointer';
    section.style.position = 'relative';
    section.style.transition = 'opacity 0.2s ease';
    
    // Add color label
    const label = document.createElement('div');
    label.textContent = `${color} house`;
    label.style.position = 'absolute';
    label.style.left = '50%';
    label.style.top = '50%';
    label.style.transform = 'translate(-50%, -50%)';
    label.style.color = ['yellow', 'mint', 'light blue'].includes(color) ? '#1F2937' : 'white';
    label.style.fontSize = '1rem';
    label.style.fontWeight = '600';
    label.style.textTransform = 'capitalize';
    label.style.textShadow = ['yellow', 'mint', 'light blue'].includes(color) ? 'none' : '0 1px 2px rgba(0,0,0,0.2)';
    label.style.pointerEvents = 'none';
    
    section.appendChild(label);
    
    section.onmouseover = () => {
      section.style.opacity = '0.9';
    };
    
    section.onmouseout = () => {
      section.style.opacity = '0.8';
    };
    
    section.onclick = () => {
      section.style.opacity = '1';
      setTimeout(() => {
        card.currentColor = color;
        socket.send(JSON.stringify({
          'action': 'to_properties',
          'player': user.unique_id,
          'card': card
        }));
        resizeObserver.disconnect();
        window.removeEventListener('resize', updatePosition);
        document.body.removeChild(colorButtons);
      }, 50);
    };
    
    colorButtons.appendChild(section);
  });
  
  document.body.appendChild(colorButtons);
};

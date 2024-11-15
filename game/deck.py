from game.card import PropertyCard, ActionCard, RentCard, MoneyCard
import random

def create_deck():
    deck = []
    
    # Add Property Cards (Grouped by color)
    properties = [
        # Brown
        PropertyCard("Mediterranean Avenue", "Brown", 1),
        PropertyCard("Baltic Avenue", "Brown", 1),
        
        # Mint
        PropertyCard("Water Works", "Mint", 2),
        PropertyCard("Electric Company", "Mint", 2),
        
        # Light Blue
        PropertyCard("Connecticut Avenue", "Light Blue", 1),
        PropertyCard("Vermont Avenue", "Light Blue", 1),
        PropertyCard("Oriental Avenue", "Light Blue", 1),
        
        # Pink
        PropertyCard("St. Charles Place", "Pink", 2),
        PropertyCard("States Avenue", "Pink", 2),
        PropertyCard("Virginia Avenue", "Pink", 2),
        
        # Orange
        PropertyCard("Tennessee Avenue", "Orange", 2),
        PropertyCard("New York Avenue", "Orange", 2),
        PropertyCard("St. James Place", "Orange", 2),
        
        # Red
        PropertyCard("Illinois Avenue", "Red", 3),
        PropertyCard("Indiana Avenue", "Red", 3),
        PropertyCard("Kentucky Avenue", "Red", 3),
        
        # Yellow
        PropertyCard("Atlantic Avenue", "Yellow", 3),
        PropertyCard("Marvin Gardens", "Yellow", 3),
        PropertyCard("Ventnor Avenue", "Yellow", 3),
        
        # Green
        PropertyCard("Pacific Avenue", "Green", 4),
        PropertyCard("North Carolina Avenue", "Green", 4),
        PropertyCard("Pennsylvania Avenue", "Green", 4),
        
        # Blue
        PropertyCard("Boardwalk", "Blue", 4),
        PropertyCard("Park Place", "Blue", 4),
        
        # Black (Railroads)
        PropertyCard("Short Line", "Black", 2),
        PropertyCard("Pennsylvania Railroad", "Black", 2),
        PropertyCard("Reading Railroad", "Black", 2),
        PropertyCard("B. & O. Railroad", "Black", 2),
        
        # Wild Properties
        PropertyCard("Wild Property", ['blue', 'green'], 4, True),
        *[PropertyCard("Wild Property", ['red', 'yellow'], 3, True) for _ in range(2)],
        *[PropertyCard("Wild Property", ['pink', 'orange'], 2, True) for _ in range(2)],
        PropertyCard("Wild Property", ['black', 'mint'], 2, True),
        PropertyCard("Wild Property", ['black', 'light blue'], 4, True),
        PropertyCard("Wild Property", ['black', 'green'], 4, True),
        PropertyCard("Wild Property", ['brown', 'light blue'], 1, True),
        *[PropertyCard("Wild", ['brown', 'mint', 'light blue', 'pink', 'orange', 'red', 'yellow', 'green', 'blue', 'black'], None, True) for _ in range(2)]
    ]
    
    # Add Rent Cards
    rents = [
        *[RentCard("Brown/Mint/Light Blue/Pink/Orange/Red/Yellow/Green/Blue/Black", 3) for _ in range(3)],
        *[RentCard("Blue/Green", 1) for _ in range(2)],
        *[RentCard("Mint/Black", 1) for _ in range(2)],
        *[RentCard("Red/Yellow", 1) for _ in range(2)],
        *[RentCard("Orange/Pink", 1) for _ in range(2)],
        *[RentCard("Brown/Light Blue", 1) for _ in range(2)]
    ]
    
    # Add Action Cards
    actions = [
        *[ActionCard("Deal Breaker", 5) for _ in range(2)],
        *[ActionCard("Debt Collector", 3) for _ in range(3)],
        *[ActionCard("Double The Rent", 1) for _ in range(2)],
        *[ActionCard("Just Say No", 4) for _ in range(3)],
        *[ActionCard("Sly Deal", 3) for _ in range(3)],
        *[ActionCard("It's Your Birthday", 2) for _ in range(3)],
        *[ActionCard("House", 3) for _ in range(3)],
        *[ActionCard("Hotel", 4) for _ in range(3)],
        *[ActionCard("Pass Go", 1) for _ in range(10)],
        *[ActionCard("Forced Deal", 3) for _ in range(4)]
    ]
    
    # Add Money Cards
    money = [
        *[MoneyCard(1) for _ in range(6)],
        *[MoneyCard(2) for _ in range(5)],
        *[MoneyCard(3) for _ in range(3)],
        *[MoneyCard(4) for _ in range(3)],
        *[MoneyCard(5) for _ in range(2)],
        MoneyCard(10),
    ]
    
    # Combine all cards into the deck
    deck.extend(properties)
    deck.extend(rents)
    deck.extend(actions)
    deck.extend(money)
    
    # Shuffle the deck
    random.shuffle(deck)
    
    return deck

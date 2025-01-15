from game.card import PropertyCard, ActionCard, RentCard, MoneyCard
import random

def create_deck():
    deck = []
    card_id = 1  # Start ID counter
    
    # Add Property Cards (Grouped by color)
    properties = [
        # Brown
        PropertyCard("Mediterranean Avenue", "brown", 1, card_id=((card_id := card_id + 1))),
        PropertyCard("Baltic Avenue", "brown", 1, card_id=((card_id := card_id + 1))),
        
        # Mint
        PropertyCard("Water Works", "mint", 2, card_id=((card_id := card_id + 1))),
        PropertyCard("Electric Company", "mint", 2, card_id=((card_id := card_id + 1))),
        
        # Light Blue
        PropertyCard("Connecticut Avenue", "light blue", 1, card_id=((card_id := card_id + 1))),
        PropertyCard("Vermont Avenue", "light blue", 1, card_id=((card_id := card_id + 1))),
        PropertyCard("Oriental Avenue", "light blue", 1, card_id=((card_id := card_id + 1))),
        
        # Pink
        PropertyCard("St. Charles Place", "pink", 2, card_id=((card_id := card_id + 1))),
        PropertyCard("States Avenue", "pink", 2, card_id=((card_id := card_id + 1))),
        PropertyCard("Virginia Avenue", "pink", 2, card_id=((card_id := card_id + 1))),
        
        # Orange
        PropertyCard("Tennessee Avenue", "orange", 2, card_id=((card_id := card_id + 1))),
        PropertyCard("New York Avenue", "orange", 2, card_id=((card_id := card_id + 1))),
        PropertyCard("St. James Place", "orange", 2, card_id=((card_id := card_id + 1))),
        
        # Red
        PropertyCard("Illinois Avenue", "red", 3, card_id=((card_id := card_id + 1))),
        PropertyCard("Indiana Avenue", "red", 3, card_id=((card_id := card_id + 1))),
        PropertyCard("Kentucky Avenue", "red", 3, card_id=((card_id := card_id + 1))),
        
        # Yellow
        PropertyCard("Atlantic Avenue", "yellow", 3, card_id=((card_id := card_id + 1))),
        PropertyCard("Marvin Gardens", "yellow", 3, card_id=((card_id := card_id + 1))),
        PropertyCard("Ventnor Avenue", "yellow", 3, card_id=((card_id := card_id + 1))),
        
        # Green
        PropertyCard("Pacific Avenue", "green", 4, card_id=((card_id := card_id + 1))),
        PropertyCard("N. Carolina Avenue", "green", 4, card_id=((card_id := card_id + 1))),
        PropertyCard("Pennsylvania Avenue", "green", 4, card_id=((card_id := card_id + 1))),
        
        # Blue
        PropertyCard("Boardwalk", "blue", 4, card_id=((card_id := card_id + 1))),
        PropertyCard("Park Place", "blue", 4, card_id=((card_id := card_id + 1))),
        
        # Black (Railroads)
        PropertyCard("Short Line", "black", 2, card_id=((card_id := card_id + 1))),
        PropertyCard("Pennsylvania Railroad", "black", 2, card_id=((card_id := card_id + 1))),
        PropertyCard("Reading Railroad", "black", 2, card_id=((card_id := card_id + 1))),
        PropertyCard("B. & O. Railroad", "black", 2, card_id=((card_id := card_id + 1))),
        
        # Wild Properties
        PropertyCard("Wild Property", ['blue', 'green'], 4, True, card_id=((card_id := card_id + 1))),
        *[PropertyCard("Wild Property", ['red', 'yellow'], 3, True, card_id=((card_id := card_id + 1))) for _ in range(2)],
        *[PropertyCard("Wild Property", ['pink', 'orange'], 2, True, card_id=((card_id := card_id + 1))) for _ in range(2)],
        PropertyCard("Wild Property", ['black', 'mint'], 2, True, card_id=((card_id := card_id + 1))),
        PropertyCard("Wild Property", ['black', 'light blue'], 4, True, card_id=((card_id := card_id + 1))),
        PropertyCard("Wild Property", ['black', 'green'], 4, True, card_id=((card_id := card_id + 1))),
        PropertyCard("Wild Property", ['brown', 'light blue'], 1, True, card_id=((card_id := card_id + 1))),
        *[PropertyCard("Wild", ['brown', 'mint', 'light blue', 'pink', 'orange', 'red', 'yellow', 'green', 'blue', 'black'], None, True, card_id=((card_id := card_id + 1))) for _ in range(2)]
    ]
    
    # Add Rent Cards
    rents = [
        *[RentCard(['brown', 'mint', 'light blue', 'pink', 'orange', 'red', 'yellow', 'green', 'blue', 'black'], True, card_id=((card_id := card_id + 1))) for _ in range(3)],
        *[RentCard(['blue', 'green'], card_id=((card_id := card_id + 1))) for _ in range(2)],
        *[RentCard(['mint', 'black'], card_id=((card_id := card_id + 1))) for _ in range(2)],
        *[RentCard(['red', 'yellow'], card_id=((card_id := card_id + 1))) for _ in range(2)],
        *[RentCard(['orange', 'pink'], card_id=((card_id := card_id + 1))) for _ in range(2)],
        *[RentCard(['brown', 'light blue'], card_id=((card_id := card_id + 1))) for _ in range(2)]
    ]
    
    # Add Action Cards
    actions = [
        *[ActionCard("Deal Breaker", card_id=((card_id := card_id + 1))) for _ in range(2)],
        *[ActionCard("Debt Collector", card_id=((card_id := card_id + 1))) for _ in range(3)],
        *[ActionCard("Double The Rent", card_id=((card_id := card_id + 1))) for _ in range(2)],
        *[ActionCard("Just Say No", card_id=((card_id := card_id + 1))) for _ in range(3)],
        *[ActionCard("Sly Deal", card_id=((card_id := card_id + 1))) for _ in range(3)],
        *[ActionCard("It's Your Birthday", card_id=((card_id := card_id + 1))) for _ in range(3)],
        *[ActionCard("House", card_id=((card_id := card_id + 1))) for _ in range(3)],
        *[ActionCard("Hotel", card_id=((card_id := card_id + 1))) for _ in range(3)],
        *[ActionCard("Pass Go", card_id=((card_id := card_id + 1))) for _ in range(10)],
        *[ActionCard("Forced Deal", card_id=((card_id := card_id + 1))) for _ in range(4)]
    ]
    
    # Add Money Cards
    money = [
        *[MoneyCard(1, card_id=((card_id := card_id + 1))) for _ in range(6)],
        *[MoneyCard(2, card_id=((card_id := card_id + 1))) for _ in range(5)],
        *[MoneyCard(3, card_id=((card_id := card_id + 1))) for _ in range(3)],
        *[MoneyCard(4, card_id=((card_id := card_id + 1))) for _ in range(3)],
        *[MoneyCard(5, card_id=((card_id := card_id + 1))) for _ in range(2)],
        MoneyCard(10, card_id=((card_id := card_id + 1))),
    ]
    
    # Combine all cards into the deck
    deck.extend(properties)
    deck.extend(rents)
    deck.extend(actions)
    deck.extend(money)
    
    # Shuffle the deck
    random.shuffle(deck)
    
    return deck

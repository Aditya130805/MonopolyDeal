class Card:
    def __init__(self, name, card_type, value, card_id=None):
        self.name = name
        self.card_type = card_type
        self.value = value
        self.id = card_id

    def __str__(self):
        return self.name

class PropertyCard(Card):
    
    propertyMap = {
        "brown": {'rent': [1, 2], 'is_utility': False, 'is_railroad': False},
        "light blue": {'rent': [1, 2, 3], 'is_utility': False, 'is_railroad': False},
        "pink": {'rent': [1, 2, 4], 'is_utility': False, 'is_railroad': False},
        "orange": {'rent': [1, 3, 5], 'is_utility': False, 'is_railroad': False},
        "red": {'rent': [2, 3, 6], 'is_utility': False, 'is_railroad': False},
        "yellow": {'rent': [2, 4, 6], 'is_utility': False, 'is_railroad': False},
        "green": {'rent': [2, 4, 7], 'is_utility': False, 'is_railroad': False},
        "blue": {'rent': [3, 8], 'is_utility': False, 'is_railroad': False},
        "mint": {'rent': [1, 2], 'is_utility': False, 'is_railroad': False},
        "black": {'rent': [1, 2, 3, 4], 'is_utility': False, 'is_railroad': False}
    }
    
    def __init__(self, name, color, value, is_wild=False, card_id=None):
        super().__init__(name, "Property", value, card_id)
        self.colors = color if isinstance(color, list) else [color]
        self.current_color = self.colors[0]
        self.colors = color if isinstance(color, list) else color
        self.is_wild = is_wild
        self.rent = self.propertyMap[self.current_color.lower()]['rent']
        self.is_utility = self.propertyMap[self.current_color.lower()]['is_utility']
        self.is_railroad = self.propertyMap[self.current_color.lower()]['is_railroad']
    def assign_color(self, color):
        if self.is_wild and color in self.colors:
            self.current_color = color
        else:
            print("Invalid color assignment for this card.")
    def to_dict(self):
        return {
            'type': self.card_type.lower(),
            'id': self.id,
            'name': self.name,
            'color': self.colors,
            'currentColor': self.current_color,
            'value': self.value,
            'rent': self.rent,
            'isWild': self.is_wild,
            'isUtility': self.is_utility,
            'isRailroad': self.is_railroad
        }

class ActionCard(Card):
    
    actionMap = {
        "deal breaker": {'value': 5, 'description': "Steal a complete property set from any player"},
        "forced deal": {'value': 3, 'description': "Swap any property with another player"},
        "sly deal": {'value': 3, 'description': "Steal a property card from any player"},
        "debt collector": {'value': 3, 'description': "Force any player to pay you 5M"},
        "double the rent": {'value': 1, 'description': "Use with a Rent card to double the rent value"},
        "it\'s your birthday": {'value': 2, 'description': "All players must pay you 2M as a birthday gift"},
        "pass go": {'value': 1, 'description': "Draw 2 extra cards from the deck"},
        "house": {'value': 3, 'description': "Add to a full property set to add 3M to the rent value"},
        "hotel": {'value': 4, 'description': "Add to a full property set with a house to add 4M to the rent value"},
        "just say no": {'value': 4, 'description': "Cancel an action card played against you"},
    }
    
    def __init__(self, name, card_id=None):
        # super().__init__(name, "Action", value, card_id)
        self.name = name
        self.card_type = "Action"
        self.value = self.actionMap[name.lower()]['value']
        self.id = card_id
        self.description = self.actionMap[name.lower()]['description']
    
    def to_dict(self):
        return {
            'type': self.card_type.lower(),
            'id': self.id,
            'name': self.name,
            'value': self.value,
            'description': self.description
        }

class RentCard(Card):
    
    rentMap = {
        "multicolor rent": {'value': 3, 'description': "Collect rent from ONE player for any property"},
        "rent": {'value': 1, 'description': "Collect rent from all players for any of the two colors"},
    }
    
    def __init__(self, color, is_wild=False, card_id=None):
        self.card_type = "Rent"
        self.id = card_id
        self.name = "Rent"
        if is_wild: self.name = "Multicolor Rent"
        self.value = self.rentMap[self.name.lower()]['value']
        self.description = self.rentMap[self.name.lower()]['description']
        self.colors = color if isinstance(color, list) else [color]
        self.is_wild = is_wild
    
    def to_dict(self):
        return {
            'type': 'action',  # Frontend recognizes action (not rent); make it uniform within backend as well
            'id': self.id,
            'name': self.name,
            'value': self.value,
            'description': self.description,
            'rentColors': self.colors
        }

class MoneyCard(Card):
    def __init__(self, value, card_id=None):
        super().__init__(f"${value} Million", "Money", value, card_id)
    def to_dict(self):
        return {
            'type': self.card_type.lower(),
            'id': self.id,
            'value': self.value
        }

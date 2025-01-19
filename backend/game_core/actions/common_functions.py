from backend.game_core.card import PropertyCard, ActionCard

def count_fixed_property_cards(self, color):
    return sum(1 for card in self.properties.get(color, []) if isinstance(card, PropertyCard) and not card.is_wild)

def count_wild_property_cards(self, color):
    return sum(1 for card in self.properties.get(color, []) if isinstance(card, PropertyCard) and card.is_wild)

def count_house_cards(self, color):
    return sum(1 for card in self.properties.get(color, []) if isinstance(card, ActionCard) and card.name == "House")

def count_hotel_cards(self, color):
    return sum(1 for card in self.properties.get(color, []) if isinstance(card, ActionCard) and card.name == "Hotel")

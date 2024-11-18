class Card:
    def __init__(self, name, card_type, value):
        self.name = name
        self.card_type = card_type
        self.value = value
   
    def __str__(self):
        return self.name

class PropertyCard(Card):
    def __init__(self, name, color, value, is_wild=False):
        super().__init__(f"{name} ({color})", "Property", value)
        self.colors = color if isinstance(color, list) else [color]
        self.current_color = self.colors[0]
        self.is_wild = is_wild
    def assign_color(self, color):
        if self.is_wild and color in self.colors:
            self.current_color = color
        else:
            print("Invalid color assignment for this card.")

class ActionCard(Card):
    def __init__(self, name, value):
        super().__init__(name, "Action", value)

class RentCard(Card):
    def __init__(self, color, value, is_wild=False):
        super().__init__(f"Rent ({color})", "Rent", value)
        self.colors = color if isinstance(color, list) else [color]
        self.is_wild = is_wild

class MoneyCard(Card):
    def __init__(self, value):
        super().__init__(f"${value} Million", "Money", value)

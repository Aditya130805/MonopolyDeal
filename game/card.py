class Card:
    def __init__(self, name, card_type, value):
        self.name = name
        self.card_type = card_type
        self.value = value
   
    def __str__(self):
        return self.name

class PropertyCard(Card):
    def __init__(self, name, color, value):
        super().__init__(f"{name} ({color})", "Property", value)
        self.color = color

class ActionCard(Card):
    def __init__(self, name, value):
        super().__init__(name, "Action", value)

class RentCard(Card):
    def __init__(self, color, value):
        super().__init__(f"Rent ({color})", "Rent", value)
        self.color = color

class MoneyCard(Card):
    def __init__(self, value):
        super().__init__(f"${value} Million", "Money", value)

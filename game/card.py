class Card:
    def __init__(self, name, card_type, value, card_id=None):
        self.name = name
        self.card_type = card_type
        self.value = value
        self.id = card_id

    def __str__(self):
        return self.name

class PropertyCard(Card):
    def __init__(self, name, color, value, is_wild=False, card_id=None):
        super().__init__(name, "Property", value, card_id)
        self.colors = color if isinstance(color, list) else [color]
        self.current_color = self.colors[0]
        self.colors = color if isinstance(color, list) else color
        self.is_wild = is_wild
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
            'isWild': self.is_wild
        }

class ActionCard(Card):
    def __init__(self, name, value, card_id=None):
        super().__init__(name, "Action", value, card_id)
    def to_dict(self):
        return {
            'type': self.card_type.lower(),
            'id': self.id,
            'name': self.name
        }

class RentCard(Card):
    def __init__(self, color, value, is_wild=False, card_id=None):
        super().__init__("Rent", "Rent", value, card_id)
        if is_wild:
            self.name = "Multicolor Rent"
        self.colors = color if isinstance(color, list) else [color]
        self.is_wild = is_wild
    def to_dict(self):
        return {
            'type': 'action',  # Frontend recognizes action (not rent); make it uniform within backend as well
            'id': self.id,
            'name': self.name,
            'rentColors': self.colors,
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

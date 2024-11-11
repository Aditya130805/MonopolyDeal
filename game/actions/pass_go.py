from .base_action import BaseAction

class PassGo(BaseAction):
    def execute(self, card):
        # Draw 2 cards for the player
        drawn_cards = self.player.draw_cards(self.game.deck, num=2)
        print(f"{self.player.name} used Pass Go and drew 2 cards: {[str(drawn_card) for drawn_card in drawn_cards]}")
        self.game.discard_card(card)

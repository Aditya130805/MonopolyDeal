from .base_action import BaseAction

class PassGo(BaseAction):
    def execute(self, card):
        while True:
            # Ask the player for their choice
            choice = input(f"{self.player.name}, do you want to play the 'Pass Go' card, put it in the bank, or cancel it? (play/bank/cancel): ").strip().lower()

            if choice == "play":
                if len(self.game.deck) < 2:
                    print("Not enough cards in the deck to draw 2 cards. Pass Go cannot be played.")
                    return False  # Return False as the card cannot be played
                # If the player chooses to play the card, draw 2 cards
                drawn_cards = self.player.draw_cards(self.game.deck, num=2)
                print(f"{self.player.name} used Pass Go and drew 2 cards: {[str(drawn_card) for drawn_card in drawn_cards]}")
                self.game.discard_card(card)
                self.player.hand.remove(card)
                return True  # Return True as the card was played

            elif choice == "bank":
                # If the player chooses to bank the card
                self.player.add_to_bank(card)
                print(f"{self.player.name} put Pass Go in the bank.")
                self.player.hand.remove(card)
                return True  # Return True as the card was put in the bank

            elif choice == "cancel":
                # If the player chooses to cancel
                print(f"{self.player.name} canceled the Pass Go action.")
                return False  # Return False as the action was canceled

            else:
                # If the input is invalid, prompt again
                print("Invalid choice. Please type 'play', 'bank', or 'cancel'.")

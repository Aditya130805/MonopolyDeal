from .base_action import BaseAction

class JustSayNo(BaseAction):
    def execute(self, card):
        while True:
            # Ask the player for their choice
            choice = input(f"{self.player.name}, do you want to put the 'Just Say No' card in the bank or cancel it? (bank/cancel): ").strip().lower()

            if choice == "bank":
                # If the player chooses to bank the card
                self.player.add_to_bank(card)
                print(f"{self.player.name} put Just Say No in the bank.")
                self.player.hand.remove(card)
                return True  # Return True as the card was put in the bank

            elif choice == "cancel":
                # If the player chooses to cancel
                print(f"{self.player.name} canceled the Just Say No action.")
                return False  # Return False as the action was canceled

            else:
                # If the input is invalid, prompt again
                print("Invalid choice. Please type 'bank' or 'cancel'.")

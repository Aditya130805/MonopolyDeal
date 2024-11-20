from .base_action import BaseAction

class DoubleTheRent(BaseAction):
    def execute(self, card):
        while True:
            # Ask the player for their choice
            choice = input(f"{self.player.name}, do you want to put the 'Double The Rent' card in the bank or cancel it? (bank/cancel): ").strip().lower()

            if choice == "bank":
                # If the player chooses to bank the card
                self.player.add_to_bank(card)
                print(f"{self.player.name} put Double The Rent in the bank.")
                self.player.hand.remove(card)
                return True  # Return True as the card was put in the bank

            elif choice == "cancel":
                # If the player chooses to cancel
                print(f"{self.player.name} canceled the Double The Rent action.")
                return False  # Return False as the action was canceled

            else:
                # If the input is invalid, prompt again
                print("Invalid choice. Please type 'bank' or 'cancel'.")

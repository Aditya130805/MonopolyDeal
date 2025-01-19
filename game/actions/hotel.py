from .base_action import BaseAction
from game.card import ActionCard
from game.actions import common_functions
from game.properties import num_properties_needed_for_full_set

class Hotel(BaseAction):

    def _get_eligible_property_sets(self):
        """
        Check the player's properties for complete sets eligible to add a Hotel.
        Returns a list of color sets that are complete and eligible.
        """
        eligible_sets = []
        for color in self.player.properties:
            if color == 'black' or color == 'mint':
                continue
            # Check if the set is complete and doesn't already contain a "House" ActionCard
            num_property_cards = common_functions.count_fixed_property_cards(self.player, color) + common_functions.count_wild_property_cards(self.player, color)
            num_complete_sets = num_property_cards // num_properties_needed_for_full_set[color]
            if num_complete_sets <= 0:
                continue
            num_house_cards = common_functions.count_house_cards(self.player, color)
            if num_house_cards <= 0:
                continue 
            num_hotel_cards = common_functions.count_hotel_cards(self.player, color)
            i = num_house_cards
            while i > num_hotel_cards:
                eligible_sets.append(color)
                i -= 1
        return eligible_sets

    def execute(self, card):
        # Check if the player has a complete property set with a House to add a Hotel
        eligible_sets = self._get_eligible_property_sets()

        # Prompt the player if there are no eligible sets
        if not eligible_sets:
            while True:
                choice = input(f"{self.player.name}, there are no eligible property sets. Would you like to 'cancel' the action or 'bank' the Hotel card? ").strip().lower()
                if choice == "cancel":
                    print(f"{self.player.name} canceled the action.")
                    return False
                elif choice == "bank":
                    self.player.add_to_bank(card)
                    print(f"{self.player.name} added Hotel to the bank.")
                    self.player.hand.remove(card)
                    return True
                else:
                    print("Invalid choice. Please type 'cancel' to cancel or 'bank' to put the Hotel card in the bank.")

        # If eligible sets exist, prompt the player to choose a set for the Hotel
        print(f"{self.player.name}'s eligible property sets for a Hotel:")
        for i, color in enumerate(eligible_sets):
            print(f"{i}: {color} set with {len(self.player.properties[color])} properties")

        while True:
            choice = input(
                f"{self.player.name}, choose the property set to add the Hotel to (or 'cancel' to cancel the action, or 'bank' to put the Hotel in the bank): ").strip().lower()

            if choice == "cancel":
                print(f"{self.player.name} canceled the action.")
                return False

            if choice == "bank":
                self.player.add_to_bank(card)
                print(f"{self.player.name} added the Hotel card to the bank.")
                self.player.hand.remove(card)
                return True

            try:
                choice = int(choice)
                if 0 <= choice < len(eligible_sets):
                    selected_set = eligible_sets[choice]
                    # Add Hotel to the selected property set
                    self.player.properties[selected_set].append(card)
                    print(f"{self.player.name} added a Hotel to the {selected_set} set.")
                    self.player.hand.remove(card)
                    return True
                else:
                    print("Invalid choice. Try again.")
            except ValueError:
                print("Invalid input. Enter a number, 'cancel', or 'bank'.")

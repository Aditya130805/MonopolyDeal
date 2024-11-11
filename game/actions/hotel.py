# hotel.py

from .base_action import BaseAction


class Hotel(BaseAction):

    def _is_complete_set(self, color):
        """
        Check if a property set is complete based on the required number of properties for that color.
        """
        required_properties = {
            "Brown": 2, "Mint": 2, "Light Blue": 3, "Pink": 3, "Orange": 3,
            "Red": 3, "Yellow": 3, "Green": 3, "Blue": 2, "Black": 4
        }
        required_count = required_properties.get(color, float('inf'))
        return len(self.player.properties.get(color, [])) >= required_count

    def _get_eligible_property_sets(self):
        """
        Check the player's properties for complete sets with a House to be eligible for a Hotel.
        Returns a list of color sets that have a House but not a Hotel.
        """
        eligible_sets = []
        for color in self.player.properties:
            if self._is_complete_set(color) and "House" in self.player.properties[color] and "Hotel" not in \
                    self.player.properties[color]:
                eligible_sets.append(color)
        return eligible_sets

    def execute(self, card):
        # Check if the player has a complete property set with a House to add a Hotel
        eligible_sets = self._get_eligible_property_sets()

        if not eligible_sets:
            # No eligible sets, bank the Hotel card
            self.player.add_to_bank(card)
            print(f"{self.player.name} added Hotel to the bank since no property set was eligible.")
            return

        # If eligible sets exist, prompt the player to add a hotel
        print(f"{self.player.name}'s eligible property sets for a Hotel:")
        for i, color in enumerate(eligible_sets):
            print(f"{i}: {color} set with {len(self.player.properties[color])} properties")

        while True:
            choice = input(
                f"{self.player.name}, choose the property set to add the Hotel to (or 'cancel' to put it in bank): ")
            if choice.lower() == "cancel":
                self.player.add_to_bank(card)
                print(f"{self.player.name} canceled the Hotel addition and added it to the bank.")
                return

            try:
                choice = int(choice)
                if 0 <= choice < len(eligible_sets):
                    selected_set = eligible_sets[choice]
                    # Add Hotel to the selected property set
                    self.player.properties[selected_set].append(card)
                    print(f"{self.player.name} added a Hotel to the {selected_set} set.")
                    return
                else:
                    print("Invalid choice. Try again.")
            except ValueError:
                print("Invalid input. Enter a number or 'cancel'.")

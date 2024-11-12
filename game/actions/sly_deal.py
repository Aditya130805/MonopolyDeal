from game.actions.base_action import BaseAction
from game.card import ActionCard

class SlyDeal(BaseAction):

    def _is_complete_set(self, player, color):
        """
        Check if a property set is complete based on the required number of properties for that color.
        """
        required_properties = {
            "Brown": 2, "Mint": 2, "Light Blue": 3, "Pink": 3, "Orange": 3,
            "Red": 3, "Yellow": 3, "Green": 3, "Blue": 2, "Black": 4
        }
        required_count = required_properties.get(color, float('inf'))
        return len(player.properties.get(color, [])) >= required_count

    def select_property_to_steal(self):
        # Player selects which property to steal from any target player
        all_properties = []
        for player in self.game.players:
            if player != self.player:  # Exclude the player who is taking the action
                for color, properties in player.properties.items():
                    for prop in properties:
                        # Skip properties that are part of a complete set
                        if self._is_complete_set(player, color):
                            print(f"Skipping {prop}) because it's part of a complete set.")
                            continue
                        all_properties.append((player, prop))

        if not all_properties:
            print("There are no properties to steal.")
            return None

        # Display all properties available to steal
        print("\nProperties available to steal:")
        for i, (owner, prop) in enumerate(all_properties):
            print(f"{i}: {owner.name}: {prop})")

        while True:
            choice = input(f"Choose the property to steal (or type 'cancel' to cancel): ").strip()
            if choice.lower() == 'cancel':
                print("Sly Deal action cancelled.")
                return None

            try:
                choice = int(choice)
                stolen_property = all_properties[choice][1]
                target_player = all_properties[choice][0]
                return stolen_property, target_player
            except (ValueError, IndexError):
                print("Invalid choice. Please select a valid property.")

    def attempt_block_with_just_say_no(self, target_player):
        # Step 1: Check if the target player has a "Just Say No" card
        just_say_no_cards = [card for card in target_player.hand if isinstance(card, ActionCard) and card.name == "Just Say No"]
        if just_say_no_cards:
            print(f"\n{target_player.name} has a 'Just Say No' card!")
            choice = input(f"Do you want to play 'Just Say No' to block the Sly Deal? (y/n): ").strip().lower()
            if choice == 'y':
                # Block the action with 'Just Say No'
                print(f"{target_player.name} plays 'Just Say No' to block the Sly Deal.")
                # Remove the 'Just Say No' card from their hand
                target_player.hand.remove(just_say_no_cards[0])
                return True
            else:
                print(f"{target_player.name} chose not to block the Sly Deal.")
        return False

    def steal_property(self, stolen_property, target_player):
        # Step 4: Remove the property from the target player's collection
        for color in target_player.properties:
            if stolen_property in target_player.properties[color]:
                target_player.properties[color].remove(stolen_property)
                print(f"{target_player.name} lost {stolen_property}")

        # Step 5: Add the stolen property to the current player's properties
        color = stolen_property.color
        if color not in self.player.properties:
            self.player.properties[color] = []
        self.player.properties[color].append(stolen_property)

        print(f"{self.player.name} stole {stolen_property} from {target_player.name}.")
    
    def execute(self, card):
        # Ask the player for their choice (play, bank, or cancel)
        while True:
            choice = input(f"{self.player.name}, do you want to play the 'Sly Deal' card, put it in the bank, or cancel it? (play/bank/cancel): ").strip().lower()

            if choice == 'play':
                print(f"{self.player.name} plays Sly Deal!")

                # Step 1: Select a property to steal (from any other player)
                stolen_property_and_target = self.select_property_to_steal()

                if not stolen_property_and_target:
                    print("No valid property selected. Sly Deal action cancelled.")
                    return False  # Action was canceled, return False

                stolen_property, target_player = stolen_property_and_target

                # Step 2: Attempt to block the action with 'Just Say No'
                if self.attempt_block_with_just_say_no(target_player):
                    # If the action is blocked, count the card as played but no property is stolen
                    print(f"{self.player.name} played Sly Deal, but {target_player.name} blocked the action using 'Just Say No'.")
                    # Remove the Sly Deal card from the current player's hand
                    self.player.hand.remove(card)
                    return True  # Action was blocked but card was played

                # Step 3: Move the property from the target player to the player using the Sly Deal
                self.steal_property(stolen_property, target_player)

                # Discard the Sly Deal card into the discard pile
                self.game.discard_card(card)
                return True  # Property was stolen, return True

            elif choice == 'bank':
                # If the player chooses to bank the card
                self.player.add_to_bank(card)
                print(f"{self.player.name} put Sly Deal in the bank.")
                return True  # Action was completed, return True

            elif choice == 'cancel':
                # If the player chooses to cancel
                print(f"{self.player.name} canceled the Sly Deal action.")
                return False  # Action was canceled, return False

            else:
                # If the input is invalid, prompt again
                print("Invalid choice. Please type 'play', 'bank', or 'cancel'.")

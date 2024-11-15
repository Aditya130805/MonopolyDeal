from game.actions.base_action import BaseAction
from game.card import ActionCard, PropertyCard
from game.actions import common_functions
from constants.properties import num_properties_needed_for_full_set

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
                    num_total_property_cards = common_functions.count_fixed_property_cards(player, color) + common_functions.count_wild_property_cards(player, color)
                    num_complete_sets = num_total_property_cards // num_properties_needed_for_full_set[color]
                    extra_cards = num_total_property_cards % num_properties_needed_for_full_set[color]
                    if extra_cards <= 0:
                        print(f"Skipping {color} color as it has complete set(s).")
                        continue
                    for prop in properties:
                        if isinstance(prop, PropertyCard):
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

    def attempt_block_with_just_say_no(self, initiator, target_player):
        """Allows players to counter each other's 'Just Say No' cards until one side runs out or chooses not to play."""
        while True:
            # Check if the target player has a "Just Say No" card
            jsn_card = next((card for card in target_player.hand if card.name == "Just Say No"), None)
            if jsn_card:
                print(f"\n{target_player.name} has a 'Just Say No' card!")
                choice = input(f"{target_player.name}, do you want to play 'Just Say No' to block the Sly Deal? (y/n): ").strip().lower()
                if choice == 'y':
                    print(f"{target_player.name} plays 'Just Say No' to block the Sly Deal.")
                    target_player.hand.remove(jsn_card)

                    # Now check if the initiator has a "Just Say No" to counter
                    counter_jsn_card = next((card for card in initiator.hand if card.name == "Just Say No"), None)
                    if counter_jsn_card:
                        counter_choice = input(f"{initiator.name}, do you want to counter with another 'Just Say No'? (y/n): ").strip().lower()
                        if counter_choice == 'y':
                            print(f"{initiator.name} counters with 'Just Say No'.")
                            initiator.hand.remove(counter_jsn_card)
                            # Switch roles and continue the loop for another potential counter
                            initiator, target_player = target_player, initiator
                        else:
                            print(f"{initiator.name} chose not to counter. Sly Deal is blocked.")
                            return True  # Final block
                    else:
                        print(f"{initiator.name} has no 'Just Say No' to counter. Sly Deal is blocked.")
                        return True  # Blocked without counter
                else:
                    print(f"{target_player.name} chose not to block the Sly Deal. Sly Deal is not blocked.")
                    return False  # No block attempt
            else:
                print(f"{target_player.name} has no 'Just Say No' card. Sly Deal is not blocked.")
                return False  # No 'Just Say No' to block

    def steal_property(self, stolen_property, target_player):
        # Step 4: Remove the property from the target player's collection
        for color in target_player.properties:
            if stolen_property in target_player.properties[color]:
                target_player.properties[color].remove(stolen_property)
                print(f"{target_player.name} lost {stolen_property}")

        # Step 5: Add the stolen property to the current player's properties
        color = stolen_property.current_color
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
                if self.attempt_block_with_just_say_no(self.player, target_player):
                    # If the action is blocked, count the card as played but no property is stolen
                    print(f"{self.player.name} played Sly Deal, but {target_player.name} ultimately blocked the action using 'Just Say No'.")
                    # Discard the Sly Deal card into the discard pile
                    self.game.discard_card(card)
                    self.player.hand.remove(card)
                    return True  # Action was blocked but card was played

                # Step 3: Move the property from the target player to the player using the Sly Deal
                self.steal_property(stolen_property, target_player)

                # Discard the Sly Deal card into the discard pile
                self.game.discard_card(card)
                self.player.hand.remove(card)
                return True  # Property was stolen, return True

            elif choice == 'bank':
                # If the player chooses to bank the card
                self.player.add_to_bank(card)
                print(f"{self.player.name} put Sly Deal in the bank.")
                self.player.hand.remove(card)
                return True  # Action was completed, return True

            elif choice == 'cancel':
                # If the player chooses to cancel
                print(f"{self.player.name} canceled the Sly Deal action.")
                return False  # Action was canceled, return False

            else:
                # If the input is invalid, prompt again
                print("Invalid choice. Please type 'play', 'bank', or 'cancel'.")

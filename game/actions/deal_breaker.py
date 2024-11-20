from game.actions.base_action import BaseAction
from game.card import PropertyCard, ActionCard
from game.actions import common_functions
from constants.properties import num_properties_needed_for_full_set
from game.actions import common_functions
from game.actions.just_say_no import JustSayNo

class DealBreaker(BaseAction):
    def select_cards_from_extra(self, target_properties, num_required):
        """Allows the player to select the required number of cards from extra properties."""
        print(f"You need to select exactly {num_required} cards from the set:")
        for i, card in enumerate(target_properties):
            print(f"{i}: {card}")

        selected_cards = []
        while len(selected_cards) < num_required:
            try:
                choice = int(input(f"Select card {len(selected_cards) + 1}/{num_required} (or type '-1' to reset selection): ").strip())
                if choice == -1:
                    print("Selection reset. Start again.")
                    selected_cards = []
                elif 0 <= choice < len(target_properties) and target_properties[choice] not in selected_cards:
                    selected_cards.append(target_properties[choice])
                else:
                    print("Invalid choice or card already selected. Please try again.")
            except ValueError:
                print("Invalid input. Please enter a number corresponding to the card.")

        print("You selected the following cards:")
        for card in selected_cards:
            print(card)
        return selected_cards

    def execute_steal(self, target_player, target_color, target_properties):
        """Transfers the target set from the target player to the current player."""
        num_required = num_properties_needed_for_full_set[target_color]
        num_total_property_cards = common_functions.count_fixed_property_cards(target_player, target_color) + common_functions.count_wild_property_cards(target_player, target_color)

        # Transfer the required cards from the target player
        if num_total_property_cards == num_required:
            # Transfer all properties if it's exactly a complete set
            self.player.properties.setdefault(target_color, []).extend(target_properties)
            del target_player.properties[target_color]
            print(f"{self.player.name} stole the entire {target_color} set from {target_player.name}!")
            return
        else:
            # Allow the player to select the required number of cards
            print(f"The {target_color} set has extra cards. You must select {num_required} cards to steal a complete set.")
            selected_cards = self.select_cards_from_extra(
                [card for card in target_properties if isinstance(card, PropertyCard)],
                num_required
            )

            # Transfer selected cards to the initiator
            self.player.properties.setdefault(target_color, []).extend(selected_cards)
            for card in selected_cards:
                target_properties.remove(card)

            print(f"{self.player.name} stole a {target_color} set ({num_required} cards) from {target_player.name}!")

            # Add a House (and a Hotel) card to the initiator's properties from target player
            for card in target_properties:
                if isinstance(card, ActionCard) and card.name == "House":
                    self.player.properties[target_color].append(card)
                    target_properties.remove(card)
                    break
            for card in target_properties:
                if isinstance(card, ActionCard) and card.name == "Hotel":
                    self.player.properties[target_color].append(card)
                    target_properties.remove(card)
                    break

    def select_complete_set_to_steal(self):
        """Allows the player to select a complete set from a target player."""
        available_sets = []
        for player in self.game.players:
            if player != self.player:  # Exclude the initiating player
                for color, properties in player.properties.items():
                    num_total_property_cards = common_functions.count_fixed_property_cards(player, color) + \
                                               common_functions.count_wild_property_cards(player, color)
                    if num_total_property_cards >= num_properties_needed_for_full_set[color]:
                        available_sets.append((player, color, properties))

        if not available_sets:
            print("There are no complete sets to steal.")
            return None

        # Display all complete sets available to steal
        print("\nComplete sets available to steal:")
        for i, (owner, color, props) in enumerate(available_sets):
            props_description = ", ".join(str(prop) for prop in props)
            print(f"{i}: {owner.name}'s {color} set: {props_description}")

        while True:
            choice = input("Choose the set to steal (or type 'cancel' to cancel): ").strip()
            if choice.lower() == 'cancel':
                print("Deal Breaker action cancelled.")
                return None

            try:
                choice = int(choice)
                target_set = available_sets[choice]
                return target_set
            except (ValueError, IndexError):
                print("Invalid choice. Please select a valid set.")

    def execute(self, card):
        while True:
            choice = input(f"{self.player.name}, do you want to play the 'Deal Breaker' card, put it in the bank, or cancel it? (play/bank/cancel): ").strip().lower()

            if choice == 'play':
                print(f"{self.player.name} plays Deal Breaker!")

                # Step 1: Select a complete set to steal
                target_set = self.select_complete_set_to_steal()
                if not target_set:
                    print("No valid set selected. Deal Breaker action cancelled.")
                    return False

                target_player, target_color, target_properties = target_set

                # Step 2: Allow the target player to block the action with 'Just Say No'
                if JustSayNo.attempt_block_with_just_say_no(self.player, target_player, 'Deal Breaker'):
                    print(f"{self.player.name}'s Deal Breaker was ultimately blocked by {target_player.name}'s 'Just Say No'.")
                    self.game.discard_card(card)
                    self.player.hand.remove(card)
                    return True

                # Step 3: Execute the steal
                self.execute_steal(target_player, target_color, target_properties)

                # Discard the Deal Breaker card
                self.game.discard_card(card)
                self.player.hand.remove(card)
                return True

            elif choice == 'bank':
                self.player.add_to_bank(card)
                print(f"{self.player.name} put Deal Breaker in the bank.")
                self.player.hand.remove(card)
                return True

            elif choice == 'cancel':
                print(f"{self.player.name} canceled the Deal Breaker action.")
                return False

            else:
                print("Invalid choice. Please type 'play', 'bank', or 'cancel'.")

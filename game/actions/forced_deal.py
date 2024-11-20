from game.actions.base_action import BaseAction
from game.card import ActionCard, PropertyCard
from game.actions import common_functions
from constants.properties import num_properties_needed_for_full_set
from game.actions.just_say_no import JustSayNo

class ForcedDeal(BaseAction):

    def select_property_to_trade(self, player):
        available_properties = []
        for color, properties in player.properties.items():
            for prop in properties:
                if isinstance(prop, PropertyCard):
                    available_properties.append(prop)

        if not available_properties:
            print("You have no properties to trade.")
            return None

        print("\nYour properties available for trade:")
        for i, prop in enumerate(available_properties):
            print(f"{i}: {prop} (Color: {prop.current_color})")

        while True:
            choice = input("Choose the property you want to offer for trade (or type 'cancel' to cancel): ").strip()
            if choice.lower() == 'cancel':
                print("Forced Deal action cancelled.")
                return None

            try:
                choice = int(choice)
                return available_properties[choice]
            except (ValueError, IndexError):
                print("Invalid choice. Please select a valid property.")

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
            print("There are no properties to trade for.")
            return None

        # Display all properties available to steal
        print("\nProperties available to steal:")
        for i, (owner, prop) in enumerate(all_properties):
            print(f"{i}: {owner.name}: {prop})")

        while True:
            choice = input("Choose the property to trade for (or type 'cancel' to cancel): ").strip()
            if choice.lower() == 'cancel':
                print("Forced Deal action cancelled.")
                return None

            try:
                choice = int(choice)
                target_property = all_properties[choice][1]
                target_player = all_properties[choice][0]
                return target_property, target_player
            except (ValueError, IndexError):
                print("Invalid choice. Please select a valid property.")

    def execute_trade(self, offered_property, target_property, target_player):
        offered_color = offered_property.current_color
        target_color = target_property.current_color

        # Remove offered property from the current player
        self.player.properties[offered_color].remove(offered_property)
        if target_color not in self.player.properties:
            self.player.properties[target_color] = []
        self.player.properties[target_color].append(target_property)

        # Remove target property from the target player
        target_player.properties[target_color].remove(target_property)
        if offered_color not in target_player.properties:
            target_player.properties[offered_color] = []
        target_player.properties[offered_color].append(offered_property)

        print(f"{self.player.name} traded {offered_property} with {target_player.name}'s {target_property}.")

    def execute(self, card):
        while True:
            choice = input(f"{self.player.name}, do you want to play the 'Forced Deal' card, put it in the bank, or cancel it? (play/bank/cancel): ").strip().lower()

            if choice == 'play':
                print(f"{self.player.name} plays Forced Deal!")

                # Step 1: Select a property to trade for
                target_property_and_player = self.select_property_to_steal()
                if not target_property_and_player:
                    print("No valid property selected. Forced Deal action cancelled.")
                    return False

                target_property, target_player = target_property_and_player

                # Step 2: Select a property from own properties to offer in trade
                offered_property = self.select_property_to_trade(self.player)
                if not offered_property:
                    print("No property selected to offer. Forced Deal action cancelled.")
                    return False

                # Step 3: Allow the target player to block the action with 'Just Say No' before executing the trade
                if JustSayNo.attempt_block_with_just_say_no(self.player, target_player, 'Forced Deal'):
                    print(f"{self.player.name}'s Forced Deal was ultimately blocked by {target_player.name}'s 'Just Say No'.")
                    self.game.discard_card(card)
                    self.player.hand.remove(card)
                    return True

                # Step 4: Execute the trade
                self.execute_trade(offered_property, target_property, target_player)

                # Discard the Forced Deal card
                self.game.discard_card(card)
                self.player.hand.remove(card)
                return True

            elif choice == 'bank':
                self.player.add_to_bank(card)
                print(f"{self.player.name} put Forced Deal in the bank.")
                self.player.hand.remove(card)
                return True

            elif choice == 'cancel':
                print(f"{self.player.name} canceled the Forced Deal action.")
                return False

            else:
                print("Invalid choice. Please type 'play', 'bank', or 'cancel'.")

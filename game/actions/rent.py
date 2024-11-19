from game.actions.base_action import BaseAction
from game.card import ActionCard, PropertyCard, RentCard
from constants.properties import rent_values, num_properties_needed_for_full_set

class Rent(BaseAction):
    def select_target_player(self):
        """Prompt the user to select a target player to charge rent."""
        print("\nPlayers available to charge rent:")
        for i, player in enumerate(self.game.players):
            if player != self.player:
                print(f"{i}: {player.name}")

        while True:
            choice = input("Select a player to charge rent to (or type 'cancel' to cancel): ").strip()
            if choice.lower() == 'cancel':
                print("Target player selection cancelled.")
                return None

            try:
                choice = int(choice)
                target_player = self.game.players[choice]
                if target_player != self.player:
                    return target_player
                else:
                    print("You cannot select yourself.")
            except (ValueError, IndexError):
                print("Invalid choice. Please select a valid player.")
    
    def attempt_block_with_just_say_no(self, initiator, target_player):
        """Allows players to counter each other's 'Just Say No' cards until one side runs out or chooses not to play."""
        while True:
            # Check if the target player has a "Just Say No" card
            jsn_card = next((card for card in target_player.hand if card.name == "Just Say No"), None)
            if jsn_card:
                print(f"\n{target_player.name} has a 'Just Say No' card!")
                choice = input(f"{target_player.name}, do you want to play 'Just Say No' to block the Rent Card? (y/n): ").strip().lower()
                if choice == 'y':
                    print(f"{target_player.name} plays 'Just Say No' to block the Rent Card.")
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
                            print(f"{initiator.name} chose not to counter. Rent Card is blocked.")
                            return True  # Final block
                    else:
                        print(f"{initiator.name} has no 'Just Say No' to counter. Rent Card is blocked.")
                        return True  # Blocked without counter
                else:
                    print(f"{target_player.name} chose not to block the Rent Card. Rent Card is not blocked.")
                    return False  # No block attempt
            else:
                print(f"{target_player.name} has no 'Just Say No' card. Rent Card is not blocked.")
                return False  # No 'Just Say No' to block
    
    def charge_rent(self, rent_card, target_player=None):
        """
        Charge rent to one or all players based on the RentCard used. 
        Only charge rent on properties matching the RentCard's colors.
        """
        # Filter properties based on the RentCard's colors
        properties_to_charge = {}
        for color in rent_card.colors:
            if color in self.player.properties and any(isinstance(prop, PropertyCard) for prop in self.player.properties[color]):
                properties_to_charge[color] = self.player.properties[color]

        if not properties_to_charge:
            print(f"{self.player.name} has no properties matching the Rent card colors to charge rent on.")
            return False

        print("\nProperty sets available to charge rent:")
        for i, (color, props) in enumerate(properties_to_charge.items()):
            print(f"{i}: {color} (Properties: {', '.join(str(p) for p in props)})")

        # Player selects which property set to charge rent on
        while True:
            choice = input(f"{self.player.name}, select the property set to charge rent on (or type 'cancel' to cancel): ").strip()
            if choice.lower() == 'cancel':
                print("Rent action cancelled.")
                return False

            try:
                choice = int(choice)
                selected_color = list(properties_to_charge.keys())[choice]
                break
            except (ValueError, IndexError):
                print("Invalid choice. Please select a valid property set.")

        # Calculate rent based on the number of properties in the selected set (+ house + hotel)
        rent_index = min(len(properties_to_charge[selected_color]), num_properties_needed_for_full_set[selected_color]) - 1
        rent_amount = rent_values[selected_color][rent_index]
        if any(isinstance(card, ActionCard) and card.name == "House" for card in properties_to_charge[selected_color]):
            rent_amount += 3
        if any(isinstance(card, ActionCard) and card.name == "Hotel" for card in properties_to_charge[selected_color]):
            rent_amount += 4

        if isinstance(rent_card, RentCard) and rent_card.is_wild:
            if not target_player:
                print("You must specify a target player for a wild Rent card.")
                return False

            print(f"{self.player.name} charges {target_player.name} ${rent_amount} for {selected_color} properties.")
            # Allow target player to block the action with 'Just Say No' before executing payment
            if self.attempt_block_with_just_say_no(self.player, target_player):
                print(f"{self.player.name}'s Rent Card was ultimately blocked by {target_player.name}'s 'Just Say No'.")
                return True
            target_player.pay_to_player(rent_amount, self.player)
        else:
            print(f"{self.player.name} charges all players ${rent_amount} for {selected_color} properties.")
            for player in self.game.players:
                if player != self.player:
                    # Allow target player to block the action with 'Just Say No' before executing payment
                    if self.attempt_block_with_just_say_no(self.player, player):
                        print(f"{self.player.name}'s Rent Card was ultimately blocked by {player.name}'s 'Just Say No'.")
                        continue
                    player.pay_to_player(rent_amount, self.player)

        return True
    
    def execute(self, card):
        while True:
            choice = input(f"{self.player.name}, do you want to play the Rent card, put it in the bank, or cancel? (play/bank/cancel): ").strip().lower()

            if choice == 'play':
                print(f"{self.player.name} plays Rent card!")
                target_player = None
                if isinstance(card, RentCard) and card.is_wild:
                    target_player = self.select_target_player()
                    if not target_player:
                        print("No target player selected. Rent action cancelled.")
                        return False
                if not self.charge_rent(card, target_player=target_player):
                    return False
                
                self.game.discard_card(card)
                self.player.hand.remove(card)
                return True

            elif choice == 'bank':
                self.player.add_to_bank(card)
                print(f"{self.player.name} put Rent card in the bank.")
                self.player.hand.remove(card)
                return True

            elif choice == 'cancel':
                print(f"{self.player.name} canceled the Rent action.")
                return False

            else:
                print("Invalid choice. Please type 'play', 'bank', or 'cancel'.")

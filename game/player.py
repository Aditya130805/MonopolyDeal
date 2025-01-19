from game.card import PropertyCard, MoneyCard, ActionCard, RentCard
from game.actions.pass_go import PassGo
from game.actions.house import House
from game.actions.hotel import Hotel
from game.actions.sly_deal import SlyDeal
from game.actions.forced_deal import ForcedDeal
from game.actions.deal_breaker import DealBreaker
from game.actions.just_say_no import JustSayNo
from game.actions.rent import Rent
from game.actions.debt_collector import DebtCollector
from game.actions.its_your_birthday import ItsYourBirthday
from constants.properties import num_properties_needed_for_full_set
from game.actions import common_functions
from constants import properties

class Player:
    def __init__(self, id, name):
        self.id = id
        self.name = name
        self.hand = []
        self.bank = []
        self.properties = {}

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "hand": [card.to_dict() for card in self.hand],
            "properties": {color: [card.to_dict() for card in cards] for color, cards in self.properties.items()},
            "bank": [card.to_dict() for card in self.bank]
        }

    def draw_cards(self, deck, num=2):
        drawn_cards = []
        for _ in range(num):
            if deck:
                drawn_card = deck.pop()
                self.hand.append(drawn_card)
                drawn_cards.append(drawn_card)
        return drawn_cards

    def add_to_bank(self, card):
        if not isinstance(card, PropertyCard):  # All except property cards can be banked
            self.bank.append(card)

    def play_property(self, card):
        if isinstance(card, PropertyCard):
            color = card.current_color
            if card.is_wild:
                # Prompt the player to select the color for the wild card
                print(f"{card.name} is a wild card. Choose a color from: {card.colors}")
                while True:  # Infinite loop until a valid color is chosen
                    color = input("Enter the color: ").strip().lower()
                    if color in card.colors:
                        card.assign_color(color)
                        break  # Exit the loop once a valid color is chosen
                    else:
                        print("Invalid color. Try again.")
            # Add the card to the selected color set
            if color not in self.properties:
                self.properties[color] = []
            self.properties[color].append(card)
            self.hand.remove(card)
            print(f"{self.name} played {card} to their properties.")
            
    def change_wild_card_color(self):
        # Get a list of wild cards in properties
        wild_cards = [(color, card) for color, cards in self.properties.items() for card in cards if (isinstance(card, PropertyCard) and card.is_wild)]
        
        if not wild_cards:
            print("No wild cards to change.")
            return

        # Display options to the player
        print("Wild Cards in your properties:")
        for i, (color, card) in enumerate(wild_cards):
            print(f"{i}: {card.name} (Current color: {color})")
        
        try:
            card_index = str(input("Select a wild card to change color (or 'cancel' to cancel): "))
            
            if card_index.lower() == 'cancel':
                print("Wild color change action canceled.")
                return
            
            card_index = int(card_index)
            
            old_color, selected_card = wild_cards[card_index]

            # Infinite loop until a valid color is chosen
            while True:
                print(f"Choose a new color from: {selected_card.colors} (or 'cancel' to cancel): ")
                new_color = str(input("Enter the color: ").strip())
                
                if new_color.lower() == 'cancel':
                    print("Wild color change action canceled.")
                    return

                if new_color not in selected_card.colors:
                    print("Invalid color choice. Try again.")
                else:
                    if len(self.properties[old_color]) > num_properties_needed_for_full_set[old_color]:
                        # Either a complete set + more properties OR a complete set + House (+ Hotel)
                        num_fixed_property_cards = sum(1 for card in self.properties.get(color, []) if (isinstance(card, PropertyCard) and not card.is_wild))
                        num_wild_property_cards = sum(1 for card in self.properties.get(color, []) if (isinstance(card, PropertyCard) and card.is_wild))
                        num_house_cards = sum(1 for card in self.properties.get(color, []) if (isinstance(card, ActionCard) and card.name == "House"))
                        num_hotel_cards = sum(1 for card in self.properties.get(color, []) if (isinstance(card, ActionCard) and card.name == "Hotel"))
                        num_total_property_cards = num_fixed_property_cards + num_wild_property_cards
                        num_complete_sets = num_total_property_cards // num_properties_needed_for_full_set[old_color]
                        extra_wild_cards = num_total_property_cards % num_properties_needed_for_full_set[old_color]
                        if extra_wild_cards == 0:
                            # Check if houses/hotels need to be removed due to loss of a complete set
                            if num_complete_sets <= num_house_cards:
                                # Remove house from the set and move it to the bank
                                house_card = next(card for card in self.properties[old_color] if isinstance(card, ActionCard) and card.name == "House")
                                self.properties[old_color].remove(house_card)
                                self.bank.append(house_card)
                                print(f"A house was removed from the {old_color} set and added to the bank.")
                            if num_complete_sets <= num_hotel_cards:
                                # Remove hotel from the set and move it to the bank
                                hotel_card = next(card for card in self.properties[old_color] if isinstance(card, ActionCard) and card.name == "Hotel")
                                self.properties[old_color].remove(hotel_card)
                                self.bank.append(hotel_card)
                                print(f"A hotel was removed from the {old_color} set and added to the bank.")
                    
                    # Remove from old color list and update the wild card's current color
                    self.properties[old_color].remove(selected_card)
                    if not self.properties[old_color]:  # Clean up empty color lists
                        del self.properties[old_color]

                    selected_card.assign_color(new_color)
                    if new_color not in self.properties:
                        self.properties[new_color] = []
                    self.properties[new_color].append(selected_card)

                    print(f"Wild card color changed to {new_color} and moved to that property set.")
                    break  # Exit the loop once a valid color is chosen
            
        except (ValueError, IndexError):
            print("Invalid selection.")

    def use_action_card(self, card, game):
        if isinstance(card, ActionCard):

            # Just Say No - within the non-implemented actions
            # Double the Rent

            action_map = {
                "Pass Go": PassGo,
                "House": House,
                "Hotel": Hotel,
                "Sly Deal": SlyDeal,
                "Forced Deal": ForcedDeal,
                "Deal Breaker": DealBreaker,
                "Just Say No": JustSayNo,
                "Debt Collector": DebtCollector,
                "It's Your Birthday": ItsYourBirthday
                # Add other actions as they are created
            }

            action_class = action_map.get(card.name)
            if action_class:
                action = action_class(self, game)
                if action.execute(card):
                    return True
            else:
                print(f"Action {card.name} is not implemented.")
            return False

    def take_action(self, game):
        if not self.hand:
            print(f"{self.name} has no cards to play.")
            return False

        # Display the player's hand once
        print(f"\n{self.name}'s hand: {[f'{i}: {card}' for i, card in enumerate(self.hand)]}\n")

        while True:
            choice = input(f"{self.name}, enter the number of the card you want to play, 'wild' to change a wild card's color, or 'skip' to end your turn: ")

            if choice.lower() == "skip":
                return False
            elif choice.lower() == "wild":
                self.change_wild_card_color()
                continue
            try:
                choice = int(choice)
                if choice < 0 or choice >= len(self.hand):
                    print("Invalid choice. Try again.")
                    continue

                card = self.hand[choice]
                # Determine the type of card and play it accordingly
                if isinstance(card, PropertyCard):
                    self.play_property(card)
                elif isinstance(card, MoneyCard):
                    self.add_to_bank(card)
                    self.hand.remove(card)
                    print(f"{self.name} added {card} to the bank.")
                elif isinstance(card, ActionCard):
                    if not self.use_action_card(card, game):
                        continue
                elif isinstance(card, RentCard):
                    action = Rent(self, game)
                    if not action.execute(card):
                        continue
                else:
                    print("Unhandled card type.")
                break  # Exit the loop after a valid action
            except ValueError:
                print("Invalid input. Please enter a valid card number or 'skip'.")

        return True

    def pay_to_player(self, amount, target_player):
        """
        Handles payment from the initiator (self) to the target_player. The player can pay using cards from their 
        bank or properties, with options to restart the selection or finalize after reaching or exceeding the amount.
        """
        print(f"\n{self.name}, you need to pay ${amount} to {target_player.name}.")
        
        # Check if the player has nothing to pay from
        if not self.bank and (not any(self.properties[color] for color in self.properties) or all(prop.name in [properties.wild_multicolor1.name, properties.wild_multicolor2.name] for color in self.properties for prop in self.properties[color])):
            print(f"{self.name} has nothing to pay with. Transaction completed.")
            return  # Exit if there are no available cards to pay with

        payment = []
        total_payment = 0

        # Store initial states of bank and properties for resetting
        initial_bank = self.bank[:]
        initial_properties = {color: cards[:] for color, cards in self.properties.items()}

        def reset_payment():
            """Resets payment selection by returning cards to their original locations."""
            nonlocal payment, total_payment
            # Restore the initial bank and properties states
            self.bank = initial_bank[:]
            self.properties = {color: cards[:] for color, cards in initial_properties.items()}
            
            # Clear the payment and total_payment
            payment.clear()
            total_payment = 0

        while total_payment < amount or not payment:
            print("\n--- Current Payment Selection ---")
            for card in payment:
                print(f"- {card.name} (${card.value})")
            print(f"Total selected: ${total_payment} / ${amount}")

            print("\n--- Available Cards for Payment ---")
            print("Bank:")
            for i, card in enumerate(self.bank):
                print(f"  {i}. {card.name} (${card.value})")
            if not self.bank:
                print("  No cards available in your bank.")

            print("\nProperties:")
            for color, cards in self.properties.items():
                print(f"  {color}: {[card.name for card in cards]}")
            if not any(self.properties[color] for color in self.properties):
                print("  No properties available for payment.")

            # If there are no available cards to pay from, finalize the transaction
            if not self.bank and (not any(self.properties[color] for color in self.properties) or all(prop.name in [properties.wild_multicolor1.name, properties.wild_multicolor2.name] for color in self.properties for prop in self.properties[color])):
                print(f"\n{self.name} has no more cards to pay with.")
                # Finalize payment
                print("\nPayment finalized. Transferring cards to the target player.")
                for card in payment:
                    if isinstance(card, PropertyCard):
                        if card.current_color not in target_player.properties:
                            target_player.properties[card.current_color] = []
                        target_player.properties[card.current_color].append(card)
                    else:
                        target_player.bank.append(card)
                print(f"{self.name} has paid ${total_payment} to {target_player.name}.")
                return  # End the function here if no more cards are available for payment

            print("\nChoose 'bank', 'property', or 'restart':")
            choice = input("Where do you want to pay from? ").strip().lower()

            if choice == 'restart':
                print("\nRestarting payment selection...")
                reset_payment()  # Reset the payment and total_payment
                return self.pay_to_player(amount, target_player)  # Restart by calling the function again

            elif choice == 'bank':
                if not self.bank:
                    print("\nYour bank has no cards to pay with. Please choose another option.")
                    continue  # Prompt the user again without restarting the selection

                print("\n--- Bank Cards ---")
                for i, card in enumerate(self.bank):
                    print(f"{i}. {card.name} (${card.value})")
                
                while True:
                    print("Enter the number of the card to select or 'restart':")
                    bank_choice = input().strip()

                    if bank_choice == 'restart':
                        print("\nRestarting payment selection...")
                        reset_payment()  # Reset the payment and total_payment
                        return self.pay_to_player(amount, target_player)  # Restart by calling the function again
                
                    try:
                        bank_choice = int(bank_choice)
                        if 0 <= bank_choice < len(self.bank):
                            selected_card = self.bank.pop(bank_choice)
                            payment.append(selected_card)
                            total_payment += selected_card.value
                            break
                        else:
                            print("\nInvalid selection. Try again.")
                    except ValueError:
                        print("\nInvalid input. Try again.")

            elif choice == 'property':
                if not any(self.properties[color] for color in self.properties):
                    print("\nYou have no properties available for payment. Please choose another option.")
                    continue  # Prompt the user again without restarting the selection

                print("\n--- Properties ---")
                for color, cards in self.properties.items():
                    print(f"  {color}: {[card.name for card in cards]}")
                while True:
                    print("Enter the color of the property set or 'restart':")
                    color_choice = input().strip().lower()

                    if color_choice == 'restart':
                        print("\nRestarting payment selection...")
                        reset_payment()  # Reset the payment and total_payment
                        return self.pay_to_player(amount, target_player)  # Restart by calling the function again

                    if color_choice in self.properties and self.properties[color_choice]:
                        print(f"\n--- {color_choice.title()} Properties ---")
                        for i, card in enumerate(self.properties[color_choice]):
                            print(f"{i}. {card.name} (${card.value})")
                        print("Enter the number of the card to select or 'restart':")
                        property_choice = input().strip()

                        if property_choice == 'restart':
                            print("\nRestarting payment selection...")
                            reset_payment()  # Reset the payment and total_payment
                            return self.pay_to_player(amount, target_player)  # Restart by calling the function again
                        
                        while True:
                            try:
                                property_choice = int(property_choice)
                                if 0 <= property_choice < len(self.properties[color_choice]):
                                    selected_card = self.properties[color_choice].pop(property_choice)
                                    payment.append(selected_card)
                                    total_payment += selected_card.value

                                    # Check if the selected card is a House and there's a Hotel on the same property set
                                    if isinstance(selected_card, ActionCard) and selected_card.name == "House":
                                        for other_card in self.properties[color_choice]:
                                            if isinstance(other_card, ActionCard) and other_card.name == "Hotel":
                                                # Move the hotel to the bank
                                                print(f"\nThe corresponding hotel from the {color_choice} set has been moved to the bank.")
                                                self.bank.append(other_card)
                                                self.properties[color_choice].remove(other_card)

                                    break
                                else:
                                    print("\nInvalid selection. Try again.")
                            except ValueError:
                                print("\nInvalid input. Try again.")
                        break
                    else:
                        print("\nInvalid color or no cards in this set. Try again.")
            else:
                print("\nInvalid choice. Please select 'bank', 'property', or 'restart'.")

        # Finalize or restart payment
        print("\n--- Final Payment Selection ---")
        for card in payment:
            print(f"- {card.name} (${card.value})")
        print(f"Total payment: ${total_payment} (required: ${amount})\n")
        confirm = input("Confirm this payment? (y/n, or type 'restart' to reset selection): ").strip().lower()

        if confirm == 'n' or confirm == 'restart':
            print("\nRestarting payment selection...")
            reset_payment()  # Reset the payment and total_payment
            return self.pay_to_player(amount, target_player)  # Restart by calling the function again

        # Finalize payment
        print("\nPayment finalized. Transferring cards to the target player.")
        for card in payment:
            if isinstance(card, PropertyCard):
                if card.current_color not in target_player.properties:
                    target_player.properties[card.current_color] = []
                target_player.properties[card.current_color].append(card)
            else:
                target_player.bank.append(card)
        print(f"{self.name} has paid ${total_payment} to {target_player.name}.")

    def has_won(self):
        # Win condition: 3 full property sets
        num_complete_sets = 0
        
        def count_property_cards(self, color):
            return sum(1 for card in self.properties.get(color, []) if isinstance(card, PropertyCard))
        
        num_properties_needed_for_full_set = {
            "brown": 2, "mint": 2, "light blue": 3, "pink": 3, "orange": 3,
            "red": 3, "yellow": 3, "green": 3, "blue": 2, "black": 4
        }
        
        for color in self.properties.keys():
            num_property_cards_in_color = count_property_cards(self, color)
            num_complete_sets_in_color = num_property_cards_in_color // num_properties_needed_for_full_set[color]
            num_complete_sets += num_complete_sets_in_color
        
        return num_complete_sets >= 3

from game.card import PropertyCard, MoneyCard, ActionCard, RentCard
from game.actions.pass_go import PassGo
from game.actions.house import House
from game.actions.hotel import Hotel
from game.actions.sly_deal import SlyDeal
from game.actions.forced_deal import ForcedDeal
from constants.properties import num_properties_needed_for_full_set
from game.actions import common_functions

class Player:
    def __init__(self, name):
        self.name = name
        self.hand = []
        self.bank = []
        self.properties = {}

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
        wild_cards = [(color, card) for color, cards in self.properties.items() for card in cards if card.is_wild]
        
        if not wild_cards:
            print("No wild cards to change.")
            return

        # Display options to the player
        print("Wild Cards in your properties:")
        for i, (color, card) in enumerate(wild_cards):
            print(f"{i}: {card.name} (Current color: {color})")
        
        try:
            card_index = int(input("Select a wild card to change color: "))
            old_color, selected_card = wild_cards[card_index]

            # Infinite loop until a valid color is chosen
            while True:
                print(f"Choose a new color from: {selected_card.colors}")
                new_color = input("Enter the color: ").strip()
                print("HERE!")

                if new_color not in selected_card.colors:
                    print("Invalid color choice. Try again.")
                else:
                    print("PRINTING:", self.properties)
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

            # Deal Breaker
            # Just Say No
            # Double the Rent
            # Debt Collector
            # It's My Birthday

            action_map = {
                "Pass Go": PassGo,
                "House": House,
                "Hotel": Hotel,
                "Sly Deal": SlyDeal,
                "Forced Deal": ForcedDeal
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
        print(f"\n{self.name}'s hand: {[f'{i}: {card}' for i, card in enumerate(self.hand)]}")

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
                    # TODO: Implement Rent logic
                    pass
                else:
                    print("Unhandled card type.")
                break  # Exit the loop after a valid action
            except ValueError:
                print("Invalid input. Please enter a valid card number or 'skip'.")

        return True

    def has_won(self):
        # Win condition: 3 full property sets
        num_complete_sets = 0
        
        for color in self.properties.keys():
            num_property_cards_in_color = common_functions.count_fixed_property_cards(self, color) + common_functions.count_wild_property_cards(self, color)
            num_complete_sets_in_color = num_property_cards_in_color // num_properties_needed_for_full_set[color]
            num_complete_sets += num_complete_sets_in_color
        
        return num_complete_sets >= 3

from game.card import PropertyCard, MoneyCard, ActionCard, RentCard
from game.actions.pass_go import PassGo
from game.actions.house import House
from game.actions.hotel import Hotel


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
            color = card.color
            if color not in self.properties:
                self.properties[color] = []
            self.properties[color].append(card)
            self.hand.remove(card)
            print(f"{self.name} played {card} to their properties.")

    def use_action_card(self, card, game):
        if isinstance(card, ActionCard):

            # Deal Breaker
            # Just Say No
            # Double the Rent
            # Forced Deal
            # Sly Deal
            # Debt Collector
            # It's My Birthday

            action_map = {
                "Pass Go": PassGo,
                "House": House,
                "Hotel": Hotel,
                # Add other actions as they are created
            }

            action_class = action_map.get(card.name)
            if action_class:
                action = action_class(self, game)
                action.execute(card)
            else:
                print(f"Action {card.name} is not implemented.")

            # Remove the card from the player's hand
            self.hand.remove(card)
            # NOTE: Discarding the card to the discard pile is action specific and takes place within the action class itself

    def take_action(self, game):
        if not self.hand:
            print(f"{self.name} has no cards to play.")
            return False

        # Display the player's hand once
        print(f"\n{self.name}'s hand: {[f'{i}: {card}' for i, card in enumerate(self.hand)]}")

        while True:
            choice = input(f"{self.name}, enter the number of the card you want to play (or 'skip' to end your turn): ")

            if choice.lower() == "skip":
                return False
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
                    self.use_action_card(card, game)
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
        complete_sets = sum(len(cards) >= 3 for cards in self.properties.values())
        return complete_sets >= 3

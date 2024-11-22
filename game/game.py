from game.deck import create_deck
from game.player import Player
from colorama import init, Fore
init()  # Initialize colorama to enable cross-platform color support

class Game:
    def __init__(self, player_names):
        self.deck = create_deck()
        self.discard_pile = []
        self.players = [Player(name) for name in player_names]
        self.turn_index = 0
        self.winner = None
        self.actions = 0
        self.start_game()
        
    def to_dict(self):
        return {
            "deck_count": len(self.deck),
            "discard_pile_count": len(self.discard_pile),
            "players": [player.to_dict() for player in self.players],
            "current_turn": self.players[self.turn_index].name,
            "winner": self.winner.name if self.winner else None
        }

    def start_game(self):
        # Distribute 5 cards to each player
        print("Dealing 5 cards to each player...", end=" ")
        for player in self.players:
            player.draw_cards(self.deck, 5)
        print("Done\n")
        
    def print_colored(self, player_number, text):
        if player_number == 0:
            print(f"{Fore.BLUE}{text}{Fore.RESET}")
        elif player_number == 1:
            print(f"{Fore.GREEN}{text}{Fore.RESET}")
        elif player_number == 2:
            print(f"{Fore.RED}{text}{Fore.RESET}")
        else:
            print(text)  # No color for other players
    
    def play_turn(self):
        """Plays a single turn for the current player."""
        current_player = self.players[self.turn_index]
        self.print_colored(self.turn_index, f"\n{current_player.name}'s turn –––––––––––––––––>")

        # Draw cards at the start of the turn
        if len(current_player.hand) == 0:
            current_player.draw_cards(self.deck, 5)
        else:
            current_player.draw_cards(self.deck, 2)

        # Let the player take up to 3 actions
        self.actions = 0
        while len(current_player.hand) > 7 or self.actions < 3:
            self.print_colored(self.turn_index, f"\n--------------\nTurn {self.actions + 1}\n--------------")
            if not current_player.take_action(self):
                if len(current_player.hand) <= 7:
                    break
                else:
                    print(
                        f"You currently have {len(current_player.hand)} cards in hand. To comply with the maximum limit of 7 cards, you must play at least {len(current_player.hand) - 7} more action(s)."
                    )  # Make player play forcefully
                    continue
            self.actions += 1

        # Check if the player has won by collecting 3 full property sets
        if current_player.has_won():
            self.winner = current_player
            self.print_colored(self.turn_index, f"\n{current_player.name} has won the game!\n")
            return

        # Move to the next player's turn
        self.turn_index = (self.turn_index + 1) % len(self.players)

    def discard_card(self, card):
        self.discard_pile.append(card)

    def game_loop(self):
        while not self.winner:
            self.play_turn()

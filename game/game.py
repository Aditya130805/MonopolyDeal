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
        self.start_game()

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
        current_player = self.players[self.turn_index]
        self.print_colored(self.turn_index, f"\n{current_player.name}'s turn –––––––––––––––––>")

        # Draw cards at the start of the turn
        if len(current_player.hand) == 0:
            current_player.draw_cards(self.deck, 5)
        else:
            current_player.draw_cards(self.deck, 2)

        # Let the player take up to 3 actions
        actions = 0
        while actions < 3:
            self.print_colored(self.turn_index, f"\n--------------\nTurn {actions + 1}\n--------------")
            if not current_player.take_action(self):
                break
            actions += 1

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

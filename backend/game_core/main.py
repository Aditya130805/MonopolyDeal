from backend.game_core.game import Game

def main():
    # Initialize the game with player names
    player_names = ["Alice", "Bob", "Charlie"]
    game = Game(player_names)
    
    # Start the game
    game.game_loop()

if __name__ == "__main__":
    main()

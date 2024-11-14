import pytest
from unittest.mock import patch
from game.actions.pass_go import PassGo
from game.card import ActionCard
from game.player import Player
from game.deck import create_deck
from game.game import Game

@pytest.fixture
def game_setup():
    """Fixture to set up a basic game environment with one player."""
    # Create a game with one player
    game = Game(["Player 1"])
    return game

@pytest.fixture
def player_with_pass_go(game_setup):
    """Fixture to add 'Pass Go' card to a player's hand."""
    game = game_setup
    # Give the player a "Pass Go" card
    pass_go_card = ActionCard("Pass Go", 1)
    player = game.players[0]
    player.hand.append(pass_go_card)
    return player, pass_go_card, game

@pytest.fixture
def multiplayer_game_setup():
    """Fixture to set up a game with multiple players."""
    game = Game(["Player 1", "Player 2"])
    return game

# Test 1: Test playing the 'Pass Go' card (draw 2 cards)
def test_play_pass_go(player_with_pass_go):
    player, pass_go_card, game = player_with_pass_go

    # Mock the input to simulate the player choosing "play"
    with patch('builtins.input', return_value='play'):
        result = PassGo(player, game).execute(pass_go_card)
        
        # Check if the correct number of cards are drawn
        assert len(player.hand) == 7  # 5 initial cards + 2 drawn from Pass Go
        assert result is True  # The action was successfully played

# Test 2: Test banking the 'Pass Go' card
def test_bank_pass_go(player_with_pass_go):
    player, pass_go_card, game = player_with_pass_go

    # Mock the input to simulate the player choosing "bank"
    with patch('builtins.input', return_value='bank'):
        result = PassGo(player, game).execute(pass_go_card)
        
        # Check if the card is moved to the bank
        assert pass_go_card in player.bank
        assert pass_go_card not in player.hand
        assert result is True  # The action was successfully completed

# Test 3: Test canceling the 'Pass Go' card action
def test_cancel_pass_go(player_with_pass_go):
    player, pass_go_card, game = player_with_pass_go

    # Mock the input to simulate the player choosing "cancel"
    with patch('builtins.input', return_value='cancel'):
        result = PassGo(player, game).execute(pass_go_card)
        
        # Check that the card remains in the hand and nothing else changes
        assert pass_go_card in player.hand
        assert len(player.hand) == 6  # Hand size remains the same
        assert result is False  # The action was canceled

# Test 4: Test multiple players using the 'Pass Go' card
def test_multiple_players_pass_go(multiplayer_game_setup):
    game = multiplayer_game_setup
    player1, player2 = game.players

    pass_go_card1 = ActionCard("Pass Go", 1)
    player1.hand.append(pass_go_card1)

    pass_go_card2 = ActionCard("Pass Go", 1)
    player2.hand.append(pass_go_card2)

    # Mock the input for both players choosing "play"
    with patch('builtins.input', side_effect=['play', 'play']):
        result1 = PassGo(player1, game).execute(pass_go_card1)
        result2 = PassGo(player2, game).execute(pass_go_card2)

        # Check if both players drew 2 cards each
        assert len(player1.hand) == 7  # 5 initial cards + 2 drawn from Pass Go
        assert len(player2.hand) == 7  # 5 initial cards + 2 drawn from Pass Go
        assert result1 is True  # The action was successfully played for player 1
        assert result2 is True  # The action was successfully played for player 2

"""# Test 5: Test invalid action input for 'Pass Go' – INFINITE LOOP AND IT IS SUPPOSED TO BE SO
def test_invalid_action(player_with_pass_go):
    player, pass_go_card, game = player_with_pass_go

    # Mock the input to simulate the player choosing an invalid action
    with patch('builtins.input', return_value='invalid_action'):
        result = PassGo(player, game).execute(pass_go_card)

        # Ensure the card is not played and nothing changes
        assert pass_go_card in player.hand
        assert len(player.hand) == 6  # Hand size remains the same
        assert result is False  # Invalid action should not execute"""

# Test 6: Test drawing cards when the deck is empty
def test_deck_empty(player_with_pass_go):
    player, pass_go_card, game = player_with_pass_go

    # Mock the input to simulate the player choosing "play"
    with patch('builtins.input', return_value='play'):
        # Simulate the deck being empty
        game.deck = []  # Empty deck
        result = PassGo(player, game).execute(pass_go_card)

        # Check the behavior when the deck is empty
        # For example, assuming it raises an error or returns False if no cards can be drawn
        assert result is False  # Expect False if no cards can be drawn

# Test 7: Test when a player has only the "Pass Go" card in their hand
def test_only_pass_go_in_hand(player_with_pass_go):
    player, pass_go_card, game = player_with_pass_go

    # Set up the player's hand to contain only the "Pass Go" card
    player.hand = [pass_go_card]

    # Mock the input to simulate the player choosing "play"
    with patch('builtins.input', return_value='play'):
        result = PassGo(player, game).execute(pass_go_card)

        # Check if two cards are drawn after playing the "Pass Go" card
        assert len(player.hand) == 2  # The hand should contain the 2 newly drawn cards
        assert result is True  # The action was successfully played

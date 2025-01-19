import pytest
from unittest.mock import patch
from backend.game_core.actions.double_the_rent import DoubleTheRent
from backend.game_core.card import ActionCard
from backend.game_core.player import Player
from backend.game_core.deck import create_deck
from backend.game_core.game import Game

@pytest.fixture
def game_setup():
    """Fixture to set up a basic game environment with one player."""
    # Create a game with one player
    game = Game(["Player 1"])
    return game

@pytest.fixture
def player_with_double_the_rent(game_setup):
    """Fixture to add 'Double The Rent' card to a player's hand."""
    game = game_setup
    # Give the player a "Double The Rent" card
    double_the_rent_card = ActionCard("Double The Rent", 1)
    player = game.players[0]
    player.hand.append(double_the_rent_card)
    return player, double_the_rent_card, game

@pytest.fixture
def multiplayer_game_setup():
    """Fixture to set up a game with multiple players."""
    game = Game(["Player 1", "Player 2"])
    return game

# Test 1: Test banking the 'Double The Rent' card
def test_bank_double_the_rent(player_with_double_the_rent):
    player, double_the_rent_card, game = player_with_double_the_rent

    # Mock the input to simulate the player choosing "bank"
    with patch('builtins.input', return_value='bank'):
        result = DoubleTheRent(player, game).execute(double_the_rent_card)
        
    assert result is True
    assert double_the_rent_card not in player.hand
    assert double_the_rent_card in player.bank

# Test 2: Test cancelling the 'Double The Rent' card
def test_cancel_pass_go(player_with_double_the_rent):
    player, double_the_rent_card, game = player_with_double_the_rent

    # Mock the input to simulate the player choosing "cancel"
    with patch('builtins.input', return_value='cancel'):
        result = DoubleTheRent(player, game).execute(double_the_rent_card)
        
    # Check that the card remains in the hand and nothing else changes
    assert double_the_rent_card in player.hand
    assert result is False  # The action was canceled

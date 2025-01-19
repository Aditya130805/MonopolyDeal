import pytest
from unittest.mock import patch
from backend.game_core.actions.just_say_no import JustSayNo
from backend.game_core.card import ActionCard
from backend.game_core.player import Player
from backend.game_core.game import Game

@pytest.fixture
def player_and_just_say_no():
    """Fixture to set up a player with a 'Just Say No' card."""
    player = Player("Player 1")
    just_say_no_card = ActionCard("Just Say No", 4)
    return player, just_say_no_card

@pytest.fixture
def game_setup():
    """Fixture to set up a basic game."""
    return Game(["Player 1", "Player 2"])

# Test 1: Player chooses to bank the card
def test_just_say_no_bank(player_and_just_say_no, game_setup):
    player, just_say_no_card = player_and_just_say_no
    # Remove any "Just Say No" cards that might exist in the players' hands
    player.hand = [card for card in player.hand if card.name != "Just Say No"]
    player.hand.append(just_say_no_card)
    action = JustSayNo(player, game_setup)

    with patch('builtins.input', return_value='bank'):
        result = action.execute(just_say_no_card)

        # Validate the card was banked
        assert result is True
        assert just_say_no_card in player.bank
        assert just_say_no_card not in player.hand

# Test 2: Player chooses to cancel the action
def test_just_say_no_cancel(player_and_just_say_no, game_setup):
    player, just_say_no_card = player_and_just_say_no
    # Remove any "Just Say No" cards that might exist in the players' hands
    player.hand = [card for card in player.hand if card.name != "Just Say No"]
    player.hand.append(just_say_no_card)
    action = JustSayNo(player, game_setup)

    with patch('builtins.input', return_value='cancel'):
        result = action.execute(just_say_no_card)

        # Validate the card was not banked
        assert result is False
        assert just_say_no_card in player.hand
        assert just_say_no_card not in player.bank

# Test 3: Player enters an invalid input and then valid input
def test_just_say_no_invalid_then_bank(player_and_just_say_no, game_setup, capsys):
    player, just_say_no_card = player_and_just_say_no
    # Remove any "Just Say No" cards that might exist in the players' hands
    player.hand = [card for card in player.hand if card.name != "Just Say No"]
    player.hand.append(just_say_no_card)
    action = JustSayNo(player, game_setup)

    with patch('builtins.input', side_effect=['invalid', 'bank']):
        result = action.execute(just_say_no_card)

        # Validate the card was banked after correcting the input
        assert result is True
        assert just_say_no_card in player.bank
        assert just_say_no_card not in player.hand

        # Capture printed output and validate
        captured = capsys.readouterr()
        assert "invalid choice" in captured.out.lower()
        assert f"just say no in the bank." in captured.out.lower()

# Test 4: Player enters an invalid input and then cancels
def test_just_say_no_invalid_then_cancel(player_and_just_say_no, game_setup, capsys):
    player, just_say_no_card = player_and_just_say_no
    # Remove any "Just Say No" cards that might exist in the players' hands
    player.hand = [card for card in player.hand if card.name != "Just Say No"]
    player.hand.append(just_say_no_card)
    action = JustSayNo(player, game_setup)

    with patch('builtins.input', side_effect=['wrong', 'cancel']):
        result = action.execute(just_say_no_card)

        # Validate the card was not banked
        assert result is False
        assert just_say_no_card in player.hand
        assert just_say_no_card not in player.bank

        # Capture printed output and validate
        captured = capsys.readouterr()
        assert "invalid choice" in captured.out.lower()
        assert f"canceled the just say no action." in captured.out.lower()

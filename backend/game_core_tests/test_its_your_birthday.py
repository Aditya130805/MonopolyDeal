import pytest
from unittest.mock import patch
from backend.game_core.actions.its_your_birthday import ItsYourBirthday
from backend.game_core.card import ActionCard, MoneyCard
from backend.game_core.player import Player
from backend.game_core.game import Game
from backend.game_core import properties

# Fixtures for setting up the game
@pytest.fixture
def game_setup():
    """Fixture to set up a basic game with three players."""
    game = Game(["Player 1", "Player 2"])
    return game

@pytest.fixture
def player_with_birthday_card(game_setup):
    """Fixture to add an 'It's Your Birthday' card to the player's hand."""
    game = game_setup
    birthday_card = ActionCard("It's Your Birthday", 2)
    player_1 = game.players[0]
    player_2 = game.players[1]
    player_1.hand.append(birthday_card)
    # Remove any "Just Say No" cards that might exist in the players' hands
    player_1.hand = [card for card in player_1.hand if card.name != "Just Say No"]
    player_2.hand = [card for card in player_2.hand if card.name != "Just Say No"]
    return player_1, player_2, birthday_card, game

# Test 1: Successful execution of "It's Your Birthday"
def test_birthday_action_success(player_with_birthday_card):
    player, player_2, birthday_card, game = player_with_birthday_card

    # Add money to Player 2 and Player 3's banks
    player_2.bank = [MoneyCard(2)]

    # Mock inputs for the action
    with patch('builtins.input', side_effect=['play', 'bank', '0', 'y']):
        action = ItsYourBirthday(player, game)
        result = action.execute(birthday_card)

        # Assert the action was executed successfully
        assert result is True
        assert any(isinstance(card, MoneyCard) and card.value == 2 for card in player.bank)
        assert not any(isinstance(card, MoneyCard) and card.value == 2 for card in player_2.bank)

# Test 2: Successful execution of "It's Your Birthday" with multiple players
def test_birthday_action_success_with_multiple_players(player_with_birthday_card):
    player, player_2, birthday_card, game = player_with_birthday_card

    player_2.properties = {'blue': [properties.blue1]}

    # Create a new player with money in the bank
    new_player = Player("New Player")
    new_player.bank = [MoneyCard(5)]
    game.players.append(new_player)  # Add the new player to the game
    
    # Remove any "Just Say No" cards that might exist in the new_player's hand
    new_player.hand = [card for card in new_player.hand if card.name != "Just Say No"]

    # Mock inputs for the action
    with patch('builtins.input', side_effect=['play', 'property', 'blue', '0', 'y', 'bank', '0', 'y']):
        action = ItsYourBirthday(player, game)
        result = action.execute(birthday_card)

        # Assert the action was executed successfully
        assert result is True
        if 'blue' in player_2.properties:
            assert len(player_2.properties['blue']) == 0
        assert 'blue' in player.properties
        assert not any(isinstance(card, MoneyCard) and card.value == 5 for card in new_player.bank)
        assert any(isinstance(card, MoneyCard) and card.value == 5 for card in player.bank)

# Test 3: Action canceled by the player
def test_birthday_action_canceled(player_with_birthday_card):
    player, player_2, birthday_card, game = player_with_birthday_card

    # Mock input to simulate player choosing 'cancel'
    with patch('builtins.input', return_value='cancel'):
        action = ItsYourBirthday(player, game)
        result = action.execute(birthday_card)

        # Ensure the action was not executed
        assert result is False
        assert birthday_card in player.hand

# Test 4: A player blocks the action with "Just Say No"
def test_birthday_action_blocked_by_just_say_no(player_with_birthday_card):
    player, player_2, birthday_card, game = player_with_birthday_card

    # Add a "Just Say No" card to Player 2's hand
    jsn_card = ActionCard("Just Say No", 4)
    player_2.hand.append(jsn_card)
    
    player.bank = []
    player_2.bank = [MoneyCard(2)]

    # Mock inputs for the action
    with patch('builtins.input', side_effect=['play', 'y']):
        action = ItsYourBirthday(player, game)
        result = action.execute(birthday_card)

        # Assert the action was blocked
        assert result is True
        assert jsn_card not in player_2.hand  # JSN card is used
        assert birthday_card not in player.hand
        assert not player.bank
        assert player_2.bank

# Test 5: A player has insufficient funds to pay
def test_birthday_action_insufficient_funds(player_with_birthday_card):
    player, player_2, birthday_card, game = player_with_birthday_card

    player.bank = []
    player.properties = {}

    # Player 2 has no money or properties
    player_2.bank = []
    player_2.properties = {}

    # Mock inputs for the action
    with patch('builtins.input', side_effect=['play']):
        action = ItsYourBirthday(player, game)
        result = action.execute(birthday_card)

        # Assert the action was executed
        assert result is True
        assert birthday_card not in player.hand
        assert not player_2.bank and not player_2.properties
        assert not player.bank and not player.properties

# Test 6: Action banked by the player
def test_birthday_action_banked(player_with_birthday_card):
    player, player_2, birthday_card, game = player_with_birthday_card

    # Mock input to simulate player choosing 'cancel'
    with patch('builtins.input', return_value='bank'):
        action = ItsYourBirthday(player, game)
        result = action.execute(birthday_card)

        # Ensure the action was not executed
        assert result is True
        assert birthday_card not in player.hand
        assert player.bank

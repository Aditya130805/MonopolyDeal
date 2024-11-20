import pytest
from unittest.mock import patch
from game.actions.forced_deal import ForcedDeal
from game.card import ActionCard, PropertyCard
from game.player import Player
from game.game import Game
from constants import properties

# Fixtures for game and player setup
@pytest.fixture
def game_setup():
    """Fixture to set up a basic game with two players."""
    game = Game(["Player 1", "Player 2"])
    return game

@pytest.fixture
def player_with_forced_deal(game_setup):
    """Fixture to add a 'Forced Deal' card to the initiating player's hand."""
    game = game_setup
    forced_deal_card = ActionCard("Forced Deal", 3)
    player = game.players[0]
    player.hand.append(forced_deal_card)
    return player, forced_deal_card, game

# Fixtures for setting up properties
@pytest.fixture
def players_with_properties(game_setup):
    """Fixture to assign properties to players."""
    game = game_setup
    player_1 = game.players[0]
    player_2 = game.players[1]
    red1 = PropertyCard("Illinois Avenue", "red", 3)
    red2 = PropertyCard("Indiana Avenue", "red", 3)
    blue1 = PropertyCard("Boardwalk", "blue", 4)
    # Assign properties to Player 1
    player_1.properties["red"] = [properties.red1, properties.red2]
    # Assign a non-complete set to Player 2
    player_2.properties["blue"] = [properties.blue1]

    return game, player_1, player_2

# Test 1: Execute Forced Deal with valid trade
def test_forced_deal_valid_trade(players_with_properties, player_with_forced_deal):
    game, player_1, player_2 = players_with_properties
    player, forced_deal_card, _ = player_with_forced_deal

    # Check if player_2 has a "Just Say No" card
    player_2.hand = [card for card in player_2.hand if card.name != "Just Say No"]

    # Mock inputs for trade property selections and execution flow
    with patch('builtins.input', side_effect=['play', '0', '0']):
        action = ForcedDeal(player, game)
        result = action.execute(forced_deal_card)

        # Check if the trade was successfully executed
        assert result is True
        assert properties.blue1 in player_1.properties["blue"]
        assert properties.red1 in player_2.properties["red"]

# Test 2: Forced Deal canceled by player
def test_forced_deal_canceled(player_with_forced_deal):
    player, forced_deal_card, game = player_with_forced_deal

    # Mock input to simulate player choosing 'cancel'
    with patch('builtins.input', return_value='cancel'):
        action = ForcedDeal(player, game)
        result = action.execute(forced_deal_card)

        # Ensure the card remains in the hand and action is not played
        assert result is False
        assert forced_deal_card in player.hand

# Test 3: No properties available to trade
def test_forced_deal_no_properties_to_trade(game_setup, player_with_forced_deal, capsys):
    game = game_setup
    player, forced_deal_card, _ = player_with_forced_deal

    # Mock inputs for Forced Deal
    with patch('builtins.input', side_effect=['play']):
        action = ForcedDeal(player, game)
        result = action.execute(forced_deal_card)

        # Validate that the action was canceled since there were no properties to trade
        assert result is False
        assert "no properties to trade for" in capsys.readouterr().out.lower()

# Test 4: Attempt trade with complete property set (should skip complete sets)
def test_forced_deal_skips_complete_sets(players_with_properties, player_with_forced_deal, capsys):
    game, player_1, player_2 = players_with_properties
    player, forced_deal_card, _ = player_with_forced_deal

    # Complete set for Player 2 to ensure Forced Deal skips it
    player_2.properties["blue"].append(properties.blue1)

    # Mock inputs for Forced Deal with trade selection flow
    with patch('builtins.input', side_effect=['play']):
        action = ForcedDeal(player, game)
        result = action.execute(forced_deal_card)

        # Verify that the trade was canceled as there were no valid targets
        assert result is False
        assert "skipping" in capsys.readouterr().out.lower()

# Test 5: Banking the 'Forced Deal' card
def test_bank_forced_deal(player_with_forced_deal):
    player, forced_deal_card, game = player_with_forced_deal

    # Mock input to bank the Forced Deal card
    with patch('builtins.input', return_value='bank'):
        action = ForcedDeal(player, game)
        result = action.execute(forced_deal_card)

        # Check if the card was moved to the bank
        assert result is True
        assert forced_deal_card in player.bank
        assert forced_deal_card not in player.hand

# Test 7: Forced Deal When Only Complete Sets Are Available
def test_forced_deal_only_complete_sets(players_with_properties, player_with_forced_deal, capsys):
    game, player_1, player_2 = players_with_properties
    player, forced_deal_card, _ = player_with_forced_deal

    # Give Player 2 a complete set in red
    player_2.properties = {}
    player_2.properties["red"] = [properties.red1, properties.red2, properties.red3]
    player_2.properties["blue"] = [properties.blue1, properties.blue2, ActionCard("House", 3)]

    # Attempt Forced Deal
    with patch('builtins.input', side_effect=['play']):
        action = ForcedDeal(player, game)
        result = action.execute(forced_deal_card)

        # Capture output and validate
        assert result is False
        assert "no properties to trade for" in capsys.readouterr().out.lower()

# Test 8: Forced Deal with Empty Decks During Trade Attempt
def test_forced_deal_with_empty_decks(game_setup, player_with_forced_deal, capsys):
    game = game_setup
    player, forced_deal_card, _ = player_with_forced_deal

    # Ensure no properties are present in either player's collections
    game.players[0].properties = {}
    game.players[1].properties = {}

    # Attempt Forced Deal and ensure action is canceled gracefully
    with patch('builtins.input', side_effect=['play']):
        action = ForcedDeal(player, game)
        result = action.execute(forced_deal_card)

        # Capture output and validate
        assert result is False
        assert "no properties to trade for" in capsys.readouterr().out.lower()

# Test 9: Forced Deal Blocked by One 'Just Say No' Card
def test_forced_deal_one_jsn(players_with_properties, player_with_forced_deal):
    game, player_1, player_2 = players_with_properties
    player, forced_deal_card, _ = player_with_forced_deal

    # Remove any other "Just Say No" cards that might exist in the players' hands
    player_1.hand = [card for card in player_1.hand if card.name != "Just Say No"]
    player_2.hand = [card for card in player_2.hand if card.name != "Just Say No"]
    
    # Add 'Just Say No' card to Player 2's hand
    just_say_no = ActionCard("Just Say No", 4)
    player_2.hand.append(just_say_no)

    # Mock inputs for Forced Deal with a 'Just Say No' response
    with patch('builtins.input', side_effect=['play', '0', '0', 'y']):
        action = ForcedDeal(player, game)
        result = action.execute(forced_deal_card)

        # Verify that the trade was blocked and no properties were swapped
        assert result is True
        assert properties.blue1 in player_2.properties["blue"]  # Player 2's property remains unblocked
        if "blue" in player_1.properties:
            assert properties.blue1 not in player_1.properties["blue"]

# Test 10: Forced Deal Blocked by Two 'Just Say No' Cards
def test_forced_deal_two_jsn(players_with_properties, player_with_forced_deal):
    game, player_1, player_2 = players_with_properties
    player, forced_deal_card, _ = player_with_forced_deal

    # Remove any other "Just Say No" cards that might exist in the players' hands
    player_1.hand = [card for card in player_1.hand if card.name != "Just Say No"]
    player_2.hand = [card for card in player_2.hand if card.name != "Just Say No"]

    # Add two 'Just Say No' cards to Player 2's hand
    just_say_no_1 = ActionCard("Just Say No", 4)
    just_say_no_2 = ActionCard("Just Say No", 4)
    player_1.hand.append(just_say_no_1)
    player_2.hand.append(just_say_no_1)

    # Mock inputs for Forced Deal with two 'Just Say No' responses
    with patch('builtins.input', side_effect=['play', '0', '0', 'y', 'y']):
        action = ForcedDeal(player, game)
        result = action.execute(forced_deal_card)

        # Verify that the trade went through after two "Just Say No" cards were played
        assert result is True
        assert properties.blue1 in player_1.properties["blue"]
        if "blue" in player_2.properties:
            assert properties.blue1 not in player_2.properties["blue"]
        assert properties.red1 in player_2.properties["red"]
        if "red" in player_1.properties:
            assert properties.red1 not in player_1.properties["red"]

# Test 11: Forced Deal Blocked by Three 'Just Say No' Cards
def test_forced_deal_three_jsn(players_with_properties, player_with_forced_deal):
    game, player_1, player_2 = players_with_properties
    player, forced_deal_card, _ = player_with_forced_deal

    # Remove any other "Just Say No" cards that might exist in the players' hands
    player_1.hand = [card for card in player_1.hand if card.name != "Just Say No"]
    player_2.hand = [card for card in player_2.hand if card.name != "Just Say No"]

    # Add three 'Just Say No' cards (max allowed) to the players' hands
    just_say_no_1 = ActionCard("Just Say No", 4)
    just_say_no_2 = ActionCard("Just Say No", 4)
    just_say_no_3 = ActionCard("Just Say No", 4)
    player_1.hand.extend([just_say_no_1, just_say_no_2])
    player_2.hand.append(just_say_no_3)

    # Mock inputs for Forced Deal with three 'Just Say No' responses
    with patch('builtins.input', side_effect=['play', '0', '0', 'y', 'y', 'y']):
        action = ForcedDeal(player, game)
        result = action.execute(forced_deal_card)

        # Verify that the trade was blocked after three "Just Say No" cards were played
        assert result is True
        assert properties.blue1 in player_2.properties["blue"]  # Player 2's property remains unblocked
        if "blue" in player_1.properties:
            assert properties.blue1 not in player_1.properties["blue"]

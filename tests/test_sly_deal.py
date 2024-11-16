import pytest
from unittest.mock import patch
from game.actions.sly_deal import SlyDeal
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
def player_with_sly_deal(game_setup):
    """Fixture to add a 'Sly Deal' card to the initiating player's hand."""
    game = game_setup
    sly_deal_card = ActionCard("Sly Deal", 3)
    player = game.players[0]
    player.hand.append(sly_deal_card)
    return player, sly_deal_card, game

# Fixtures for setting up properties
@pytest.fixture
def players_with_properties(game_setup):
    """Fixture to assign properties to players."""
    game = game_setup
    player_1 = game.players[0]
    player_2 = game.players[1]
    # Assign properties to Player 1
    player_1.properties["red"] = [properties.red1, properties.red2]
    # Assign a non-complete set to Player 2
    player_2.properties["blue"] = [properties.blue1]

    return game, player_1, player_2

# Test 1: Execute Sly Deal with valid steal
def test_sly_deal_valid_steal(players_with_properties, player_with_sly_deal):
    game, player_1, player_2 = players_with_properties
    player, sly_deal_card, _ = player_with_sly_deal
    
    # Check if player_2 has a "Just Say No" card
    jsn_card = next((card for card in player_2.hand if card.name == "Just Say No"), None)
    if jsn_card:
        player_2.hand.remove(jsn_card)  # Remove the "Just Say No" card from their hand

    # Mock input to simulate stealing a property
    with patch('builtins.input', side_effect=['play', '0']):
        action = SlyDeal(player, game)
        result = action.execute(sly_deal_card)

        # Check if the steal was successful
        assert result is True
        assert properties.blue1 not in player_2.properties["blue"]
        assert properties.blue1 in player_1.properties["blue"]

# Test 2: Sly Deal canceled by player
def test_sly_deal_canceled(player_with_sly_deal):
    player, sly_deal_card, game = player_with_sly_deal

    # Mock input to simulate player choosing 'cancel'
    with patch('builtins.input', return_value='cancel'):
        action = SlyDeal(player, game)
        result = action.execute(sly_deal_card)

        # Ensure the card remains in the hand and action is not played
        assert result is False
        assert sly_deal_card in player.hand

# Test 3: No properties available to steal
def test_sly_deal_no_properties_to_steal(game_setup, player_with_sly_deal, capsys):
    game = game_setup
    player, sly_deal_card, _ = player_with_sly_deal

    # Ensure Player 2 has no properties to steal
    game.players[1].properties = {}

    # Mock inputs for Sly Deal
    with patch('builtins.input', side_effect=['play']):
        action = SlyDeal(player, game)
        result = action.execute(sly_deal_card)

        # Validate that the action was canceled since there were no properties to steal
        assert result is False
        assert "no properties to steal" in capsys.readouterr().out.lower()

# Test 4: Attempt to steal a complete set (should skip complete sets)
def test_sly_deal_skips_complete_sets(players_with_properties, player_with_sly_deal, capsys):
    game, player_1, player_2 = players_with_properties
    player, sly_deal_card, _ = player_with_sly_deal

    # Make Player 2 have a complete set of red properties
    player_2.properties = {}
    player_2.properties["red"] = [properties.red1, properties.red2, properties.red3]
    player_2.properties["blue"] = [properties.blue1, properties.blue2, ActionCard("House", 3)]

    # Mock inputs for Sly Deal where Player 1 tries to steal from Player 2
    with patch('builtins.input', side_effect=['play']):
        action = SlyDeal(player, game)
        result = action.execute(sly_deal_card)

        # Verify that the action was canceled because Player 2 had a complete set
        assert result is False
        assert "skipping" in capsys.readouterr().out.lower()

# Test 5: Banking the 'Sly Deal' card
def test_bank_sly_deal(player_with_sly_deal):
    player, sly_deal_card, game = player_with_sly_deal

    # Mock input to bank the Sly Deal card
    with patch('builtins.input', return_value='bank'):
        action = SlyDeal(player, game)
        result = action.execute(sly_deal_card)

        # Check if the card was moved to the bank
        assert result is True
        assert sly_deal_card in player.bank
        assert sly_deal_card not in player.hand

# Test 6: One Just Say No card played, blocking the Sly Deal
def test_sly_deal_blocked_with_one_just_say_no(players_with_properties, player_with_sly_deal):
    game, player_1, player_2 = players_with_properties
    player, sly_deal_card, _ = player_with_sly_deal

    # Remove any other "Just Say No" cards that might exist in the players' hands
    player_1.hand = [card for card in player_1.hand if card.name != "Just Say No"]
    player_2.hand = [card for card in player_2.hand if card.name != "Just Say No"]
    
    # Add a 'Just Say No' card to Player 2's hand
    just_say_no_card = ActionCard("Just Say No", 4)
    player_2.hand.append(just_say_no_card)

    # Mock input to simulate Player 2 blocking the Sly Deal with "Just Say No"
    with patch('builtins.input', side_effect=['play', '0', 'y']):
        action = SlyDeal(player, game)
        result = action.execute(sly_deal_card)

        # Check that the steal was blocked by the "Just Say No"
        assert result is True  # The action was executed, but blocked
        assert properties.blue1 in player_2.properties["blue"]
        if "blue" in player_1.properties:
            assert properties.blue1 not in player_1.properties["blue"]

# Test 7: Two Just Say No cards played, allowing the Sly Deal to go through
def test_sly_deal_blocked_and_unblocked_with_two_just_say_no(players_with_properties, player_with_sly_deal):
    game, player_1, player_2 = players_with_properties
    player, sly_deal_card, _ = player_with_sly_deal

    # Remove any other "Just Say No" cards that might exist in the players' hands
    player_1.hand = [card for card in player_1.hand if card.name != "Just Say No"]
    player_2.hand = [card for card in player_2.hand if card.name != "Just Say No"]

    # Add a 'Just Say No' card in each players' hands
    just_say_no_card_1 = ActionCard("Just Say No", 4)
    just_say_no_card_2 = ActionCard("Just Say No", 4)
    player_1.hand.append(just_say_no_card_1)
    player_2.hand.append(just_say_no_card_2)

    # Mock input to simulate the following:
    # 1. Player 2 blocks the Sly Deal with the first "Just Say No"
    # 2. Player 1 blocks the second "Just Say No" with their own "Just Say No"
    # 3. Finally, Player 2's "Just Say No" unblocks the Sly Deal

    with patch('builtins.input', side_effect=['play', '0', 'y', 'y']):
        action = SlyDeal(player, game)
        result = action.execute(sly_deal_card)

        # Check that after the second "Just Say No", the steal goes through
        assert result is True
        assert properties.blue1 in player_1.properties["blue"]
        if "blue" in player_2.properties:
            assert properties.blue1 not in player_2.properties["blue"]

# Test 8: Three Just Say No cards played, blocking the Sly Deal
def test_sly_deal_blocked_with_three_just_say_no(players_with_properties, player_with_sly_deal):
    game, player_1, player_2 = players_with_properties
    player, sly_deal_card, _ = player_with_sly_deal

    # Remove any other "Just Say No" cards that might exist in the players' hands
    player_1.hand = [card for card in player_1.hand if card.name != "Just Say No"]
    player_2.hand = [card for card in player_2.hand if card.name != "Just Say No"]

    # Add three 'Just Say No' cards to both players' hands
    just_say_no_card_1 = ActionCard("Just Say No", 4)
    just_say_no_card_2 = ActionCard("Just Say No", 4)
    just_say_no_card_3 = ActionCard("Just Say No", 4)
    player_1.hand.extend([just_say_no_card_1, just_say_no_card_2])
    player_2.hand.append(just_say_no_card_3)

    # Mock input to simulate the following:
    # 1. Player 2 blocks the Sly Deal with the first "Just Say No"
    # 2. Player 1 blocks the second "Just Say No" with their own "Just Say No"
    # 3. Player 2 blocks again with the third "Just Say No"

    with patch('builtins.input', side_effect=['play', '0', 'y', 'y', 'y']):
        action = SlyDeal(player, game)
        result = action.execute(sly_deal_card)

        # Check that after the third "Just Say No", the Sly Deal is still blocked
        assert result is True
        assert properties.blue1 in player_2.properties["blue"]  # Player 2's property remains unblocked
        if "blue" in player_1.properties:
            assert properties.blue1 not in player_1.properties["blue"]

""" TODO: WORRY ABOUT THIS TEST AFTER IMPLEMENTING WILD CARD LOGIC CORRECTLY
# Test 9: Attempt to steal a property with a Wild Card
def test_sly_deal_with_wild_card(players_with_properties, player_with_sly_deal):
    game, player_1, player_2 = players_with_properties
    player, sly_deal_card, _ = player_with_sly_deal

    # Add a Wild Card to Player 1's properties
    wild_card = properties.wild_multicolor1
    player_1.properties["Any"] = [wild_card]

    # Mock inputs to simulate stealing the wild card
    with patch('builtins.input', side_effect=['play', '0']):
        action = SlyDeal(player, game)
        result = action.execute(sly_deal_card)

        # Ensure the wild card was successfully stolen
        assert result is True
        assert wild_card not in player_1.properties["Any"]
        assert wild_card in player_2.properties["Any"]
"""

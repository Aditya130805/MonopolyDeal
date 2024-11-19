import pytest
from unittest.mock import patch
from game.actions.debt_collector import DebtCollector
from game.card import ActionCard, PropertyCard, RentCard, MoneyCard
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
def player_with_debt(game_setup):
    """Fixture to add a 'Debt Collector' card to the initiating player's hand."""
    game = game_setup
    debt_collector_card = ActionCard("Debt Collector", 3)
    player = game.players[0]
    player.hand.append(debt_collector_card)
    return player, debt_collector_card, game

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
    player_2.bank = [MoneyCard(1)]
    # Remove any "Just Say No" cards that might exist in the players' hands
    player_1.hand = [card for card in player_1.hand if card.name != "Just Say No"]
    player_2.hand = [card for card in player_2.hand if card.name != "Just Say No"]
    return game, player_1, player_2

# Test 1: Execute DebtCollector with valid debt collection
def test_debt_collector_valid(players_with_properties, player_with_debt):
    game, player_1, player_2 = players_with_properties
    player, debt_collector_card, _ = player_with_debt
    
    # Mock input for DebtCollector execution
    with patch('builtins.input', side_effect=['play', '1', 'property', 'blue', '0', 'bank', '0', 'y']):
        action = DebtCollector(player, game)
        result = action.execute(debt_collector_card)

        # Check if debt was collected
        assert result is True
        if 'blue' in player_2.properties:
            assert len(player_2.properties['blue']) == 0
        assert not player_2.bank
        assert 'blue' in player.properties
        assert player_1.bank

# Test 2: DebtCollector action canceled by player
def test_debt_collector_canceled(players_with_properties, player_with_debt):
    game, player_1, player_2 = players_with_properties
    player, debt_collector_card, _ = player_with_debt

    # Mock input to simulate player choosing 'cancel'
    with patch('builtins.input', return_value='cancel'):
        action = DebtCollector(player, game)
        result = action.execute(debt_collector_card)

        # Ensure the Debt Collector card remains in the hand and action is not played
        assert result is False
        assert debt_collector_card in player.hand

# Test 3: No properties/money to collect debt from
def test_debt_collector_no_properties_to_collect(players_with_properties, player_with_debt, capsys):
    game, player_1, player_2 = players_with_properties
    player, debt_collector_card, _ = player_with_debt

    # Remove all properties/money from the other player
    player_2.properties = {}
    player_2.bank = []

    # Mock input for DebtCollector action
    with patch('builtins.input', side_effect=['play', '1']):
        action = DebtCollector(player, game)
        result = action.execute(debt_collector_card)

        # Validate that debt collection went through
        assert result is True
        assert "has nothing to pay with" in capsys.readouterr().out.lower()

# Test 4: DebtCollector action blocked by "Just Say No"
def test_debt_collector_with_just_say_no_block(players_with_properties, player_with_debt):
    game, player_1, player_2 = players_with_properties
    player, debt_collector_card, _ = player_with_debt

    # Add a "Just Say No" card to player_2's hand to block debt collection
    jsn_card = ActionCard("Just Say No", 4)
    player_2.hand.append(jsn_card)
    
    initial_properties_1 = {color: cards[:] for color, cards in player_1.properties.items()}
    initial_bank_1 = player_1.bank
    initial_properties_2 = {color: cards[:] for color, cards in player_2.properties.items()}
    initial_bank_2 = player_2.bank

    # Mock inputs for DebtCollector action with blocking scenario
    with patch('builtins.input', side_effect=['play', '1', 'y']):
        action = DebtCollector(player, game)
        result = action.execute(debt_collector_card)

        # Check if the Debt Collector was blocked by "Just Say No"
        assert result is True  # Debt collection was blocked, but the card counts as played
        assert jsn_card not in player_2.hand  # Just Say No card should be used
        assert player_1.properties == initial_properties_1 and player_1.bank == initial_bank_1
        assert player_2.properties == initial_properties_2 and player_2.bank == initial_bank_2

# Test 5: DebtCollector action blocked by counter choice
def test_debt_collector_blocked_by_counter_choice(players_with_properties, player_with_debt):
    game, player_1, player_2 = players_with_properties
    player, debt_collector_card, _ = player_with_debt

    # Add a "Just Say No" card to both players' hands
    jsn_card_1 = ActionCard("Just Say No", 4)
    player_1.hand.append(jsn_card_1)
    jsn_card_2 = ActionCard("Just Say No", 4)
    player_2.hand.append(jsn_card_2)

    initial_properties_1 = {color: cards[:] for color, cards in player_1.properties.items()}
    initial_bank_1 = player_1.bank
    initial_properties_2 = {color: cards[:] for color, cards in player_2.properties.items()}
    initial_bank_2 = player_2.bank

    # Mock inputs for DebtCollector action with counter choice
    with patch('builtins.input', side_effect=['play', '1', 'y', 'n']):
        action = DebtCollector(player, game)
        result = action.execute(debt_collector_card)

        # Check if the Debt Collector was blocked by "Just Say No"
        assert result is True  # Debt collection was blocked
        assert jsn_card_1 in player_1.hand  # Just Say No card should not be used
        assert jsn_card_2 not in player_2.hand  # Just Say No card should be used
        assert player_1.properties == initial_properties_1 and player_1.bank == initial_bank_1
        assert player_2.properties == initial_properties_2 and player_2.bank == initial_bank_2
        
# Test 6: DebtCollector action unblocked by counter choice
def test_debt_collector_unblocked_by_counter_choice(players_with_properties, player_with_debt):
    game, player_1, player_2 = players_with_properties
    player, debt_collector_card, _ = player_with_debt

    # Add a "Just Say No" card to both players' hands
    jsn_card_1 = ActionCard("Just Say No", 4)
    player_1.hand.append(jsn_card_1)
    jsn_card_2 = ActionCard("Just Say No", 4)
    player_2.hand.append(jsn_card_2)

    player_2.bank = [MoneyCard(2)]

    # Mock inputs for DebtCollector action with counter choice
    with patch('builtins.input', side_effect=['play', '1', 'y', 'y', 'property', 'blue', '0', 'bank', '0', 'y']):
        action = DebtCollector(player, game)
        result = action.execute(debt_collector_card)

        # Check if the Debt Collector was blocked by "Just Say No"
        assert result is True  # Debt collection was blocked
        assert jsn_card_2 not in player_2.hand  # Just Say No card should be used
        assert jsn_card_1 not in player_1.hand  # Just Say No card should be used
        if 'blue' in player_2.properties:
            assert len(player_2.properties['blue']) == 0
        assert not player_2.bank
        assert 'blue' in player.properties
        assert player_1.bank

# Test 7: DebtCollector action with insufficient funds (property payment)
def test_debt_collector_insufficient_funds_with_property(players_with_properties, player_with_debt, capsys):
    game, player_1, player_2 = players_with_properties
    player, debt_collector_card, _ = player_with_debt

    # Remove all funds from the targeted player
    player_2.bank = []

    # Mock input for DebtCollector action
    with patch('builtins.input', side_effect=['play', '1', 'property', 'blue', '0', 'y']):
        action = DebtCollector(player, game)
        result = action.execute(debt_collector_card)

        # Check if debt was collected
        assert result is True
        if 'blue' in player_2.properties:
            assert len(player_2.properties['blue']) == 0
        assert 'blue' in player.properties

# Test 8: DebtCollector action with insufficient funds (bank payment)
def test_debt_collector_insufficient_funds_with_bank(players_with_properties, player_with_debt, capsys):
    game, player_1, player_2 = players_with_properties
    player, debt_collector_card, _ = player_with_debt

    # Remove all properties from the targeted player
    player_2.properties = {}
    player_2.bank = [MoneyCard(3)]

    # Mock input for DebtCollector action
    with patch('builtins.input', side_effect=['play', '1', 'bank', '0', 'y']):
        action = DebtCollector(player, game)
        result = action.execute(debt_collector_card)

        # Check if debt was collected
        assert result is True
        assert not player_2.bank
        assert player_1.bank

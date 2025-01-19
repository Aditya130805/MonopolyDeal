import pytest
from unittest.mock import patch
from backend.game_core.actions.deal_breaker import DealBreaker
from backend.game_core.card import ActionCard, PropertyCard
from backend.game_core.player import Player
from backend.game_core.game import Game
from backend.game_core import properties

# Fixtures for game and player setup
@pytest.fixture
def game_setup():
    """Fixture to set up a basic game with two players."""
    game = Game(["Player 1", "Player 2"])
    return game

@pytest.fixture
def player_with_deal_breaker(game_setup):
    """Fixture to add a 'Deal Breaker' card to the initiating player's hand."""
    game = game_setup
    deal_breaker_card = ActionCard("Deal Breaker", 5)
    player = game.players[0]
    player.hand.append(deal_breaker_card)
    return player, deal_breaker_card, game

@pytest.fixture
def players_with_properties(game_setup):
    """Fixture to assign properties to players."""
    game = game_setup
    player_1 = game.players[0]
    player_2 = game.players[1]
    # Assign complete sets
    player_2.properties["red"] = [properties.red1, properties.red2, properties.red3]
    # Assign incomplete set
    player_2.properties["blue"] = [properties.blue1]
    return game, player_1, player_2

# Test 1: Execute Deal Breaker to steal a complete set
def test_deal_breaker_steal_complete_set(players_with_properties, player_with_deal_breaker):
    game, player_1, player_2 = players_with_properties
    player, deal_breaker_card, _ = player_with_deal_breaker
    
    # Remove any "Just Say No" cards that might exist in the players' hands
    player_1.hand = [card for card in player_1.hand if card.name != "Just Say No"]
    player_2.hand = [card for card in player_2.hand if card.name != "Just Say No"]
    
    with patch('builtins.input', side_effect=['play', '0']):
        action = DealBreaker(player, game)
        result = action.execute(deal_breaker_card)

        # Validate set transfer
        assert result is True
        assert "red" in player_1.properties
        assert "red" not in player_2.properties

# Test 2: Attempt Deal Breaker with no complete sets available
def test_deal_breaker_no_complete_sets(game_setup, player_with_deal_breaker, capsys):
    game = game_setup
    player, deal_breaker_card, _ = player_with_deal_breaker
    for p in game.players:
        p.properties = {}  # No sets available

    with patch('builtins.input', side_effect=['play']):
        action = DealBreaker(player, game)
        result = action.execute(deal_breaker_card)

        # Validate output
        assert result is False
        assert "no complete sets" in capsys.readouterr().out.lower()

# Test 3: Deal Breaker canceled by player
def test_deal_breaker_canceled(player_with_deal_breaker):
    player, deal_breaker_card, game = player_with_deal_breaker

    with patch('builtins.input', return_value='cancel'):
        action = DealBreaker(player, game)
        result = action.execute(deal_breaker_card)

        # Validate card remains in hand
        assert result is False
        assert deal_breaker_card in player.hand

# Test 4: Deal Breaker blocked by "Just Say No"
def test_deal_breaker_blocked(players_with_properties, player_with_deal_breaker):
    game, player_1, player_2 = players_with_properties
    player, deal_breaker_card, _ = player_with_deal_breaker

    # Remove any "Just Say No" cards that might exist in the players' hands
    player_1.hand = [card for card in player_1.hand if card.name != "Just Say No"]
    player_2.hand = [card for card in player_2.hand if card.name != "Just Say No"]

    just_say_no = ActionCard("Just Say No", 4)
    player_2.hand.append(just_say_no)

    with patch('builtins.input', side_effect=['play', '0', 'y']):
        action = DealBreaker(player, game)
        result = action.execute(deal_breaker_card)

        # Validate action was blocked
        assert result is True
        assert "red" in player_2.properties
        assert "red" not in player_1.properties

# Test 5: Deal Breaker with multiple players and sets
def test_deal_breaker_multiple_sets(players_with_properties, player_with_deal_breaker):
    game, player_1, player_2 = players_with_properties
    player, deal_breaker_card, _ = player_with_deal_breaker

    # Player 2 has multiple sets
    player_2.properties["green"] = [properties.green1, properties.green2, properties.green3]

    # Remove any "Just Say No" cards that might exist in the players' hands
    player_1.hand = [card for card in player_1.hand if card.name != "Just Say No"]
    player_2.hand = [card for card in player_2.hand if card.name != "Just Say No"]

    with patch('builtins.input', side_effect=['play', '1']):  # 0 = red, 1 = green
        action = DealBreaker(player, game)
        result = action.execute(deal_breaker_card)

        # Validate correct set was stolen
        assert result is True
        assert "green" in player_1.properties
        assert "green" not in player_2.properties

# Test 6: Banking the Deal Breaker card
def test_bank_deal_breaker(player_with_deal_breaker):
    player, deal_breaker_card, game = player_with_deal_breaker

    with patch('builtins.input', return_value='bank'):
        action = DealBreaker(player, game)
        result = action.execute(deal_breaker_card)

        # Validate card moved to bank
        assert result is True
        assert deal_breaker_card in player.bank
        assert deal_breaker_card not in player.hand

# Test 7: Deal Breaker with Wild Cards in the Set
def test_deal_breaker_with_wild_cards(players_with_properties, player_with_deal_breaker):
    game, player_1, player_2 = players_with_properties
    player, deal_breaker_card, _ = player_with_deal_breaker

    # Remove any "Just Say No" cards that might exist in the players' hands
    player_1.hand = [card for card in player_1.hand if card.name != "Just Say No"]
    player_2.hand = [card for card in player_2.hand if card.name != "Just Say No"]

    # Add a wild card to the red set
    wild_card = properties.wild_multicolor1
    player_2.properties["red"].append(wild_card)

    # Mock input to execute Deal Breaker on "red"
    with patch('builtins.input', side_effect=['play', '0', '3', '1', '2']):  # 0 = red, then selecting three cards
        action = DealBreaker(player, game)
        previous_player_2_red_len = len(player_2.properties["red"])
        result = action.execute(deal_breaker_card)

        # Verify three cards were transferred since three reds make up a complete set
        assert result is True
        assert len(player.properties["red"]) >= 3
        if "red" in player_2.properties.keys():
            assert len(player_2.properties["red"]) <= previous_player_2_red_len - 3

# Test 8: Deal Breaker on a Set with a House
def test_deal_breaker_with_house(players_with_properties, player_with_deal_breaker):
    game, player_1, player_2 = players_with_properties
    player, deal_breaker_card, _ = player_with_deal_breaker

    # Remove any "Just Say No" cards that might exist in the players' hands
    player_1.hand = [card for card in player_1.hand if card.name != "Just Say No"]
    player_2.hand = [card for card in player_2.hand if card.name != "Just Say No"]

    # Add a House and a Hotel to the "red" set
    house_card = ActionCard("House", 3)
    player_2.properties["red"].append(house_card)

    # Mock input to execute Deal Breaker on the "red" set
    with patch('builtins.input', side_effect=['play', '0']):  # 0 = red set
        action = DealBreaker(player, game)
        result = action.execute(deal_breaker_card)

        # Validate the entire set, including the House and Hotel, was transferred
        assert result is True
        assert "red" in player.properties
        assert "red" not in player_2.properties
        assert len(player.properties["red"]) == 4  # 3 reds + House
        assert house_card in player.properties["red"]

# Test 9: Deal Breaker on a Set with a House and Hotel
def test_deal_breaker_with_house_and_hotel(players_with_properties, player_with_deal_breaker):
    game, player_1, player_2 = players_with_properties
    player, deal_breaker_card, _ = player_with_deal_breaker

    # Remove any "Just Say No" cards that might exist in the players' hands
    player_1.hand = [card for card in player_1.hand if card.name != "Just Say No"]
    player_2.hand = [card for card in player_2.hand if card.name != "Just Say No"]

    # Add a House and a Hotel to the "red" set
    house_card = ActionCard("House", 3)
    hotel_card = ActionCard("Hotel", 4)
    player_2.properties["red"].extend([house_card, hotel_card])

    # Mock input to execute Deal Breaker on the "red" set
    with patch('builtins.input', side_effect=['play', '0']):  # 0 = red set
        action = DealBreaker(player, game)
        result = action.execute(deal_breaker_card)

        # Validate the entire set, including the House and Hotel, was transferred
        assert result is True
        assert "red" in player.properties
        assert "red" not in player_2.properties
        assert len(player.properties["red"]) == 5  # 3 reds + House + Hotel
        assert house_card in player.properties["red"]
        assert hotel_card in player.properties["red"]

# Test 10: Deal Breaker on a Set with an additional wild card and a House and Hotel
def test_deal_breaker_with_wild_and_house_and_hotel(players_with_properties, player_with_deal_breaker):
    game, player_1, player_2 = players_with_properties
    player, deal_breaker_card, _ = player_with_deal_breaker

    # Remove any "Just Say No" cards that might exist in the players' hands
    player_1.hand = [card for card in player_1.hand if card.name != "Just Say No"]
    player_2.hand = [card for card in player_2.hand if card.name != "Just Say No"]

    # Add a House and a Hotel to the "red" set
    wild_card = properties.wild_multicolor1
    house_card = ActionCard("House", 3)
    hotel_card = ActionCard("Hotel", 4)
    player_2.properties["red"].extend([house_card, hotel_card, wild_card])

    # Mock input to execute Deal Breaker on the "red" set
    with patch('builtins.input', side_effect=['play', '0', '3', '1', '2']):  # 0 = red set, then selecting three cards
        action = DealBreaker(player, game)
        result = action.execute(deal_breaker_card)

        # Validate the entire set, including the House and Hotel, was transferred
        assert result is True
        assert "red" in player.properties
        assert "red" in player_2.properties
        assert len(player_2.properties["red"]) == 1
        assert len(player.properties["red"]) == 5  # 3 reds + House + Hotel
        assert house_card in player.properties["red"]
        assert hotel_card in player.properties["red"]

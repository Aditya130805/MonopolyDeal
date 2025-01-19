import pytest
from unittest.mock import patch
from backend.game_core.actions.rent import Rent
from backend.game_core.card import ActionCard, PropertyCard, RentCard, MoneyCard
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
def player_with_rent(game_setup):
    """Fixture to add a 'Rent' card to the initiating player's hand."""
    game = game_setup
    rent_card = RentCard(["red", "yellow"], 1)
    player = game.players[0]
    player.hand.append(rent_card)
    # Remove any "Just Say No" cards that might exist in the player's hand
    player.hand = [card for card in player.hand if card.name != "Just Say No"]
    # Remove any "Double The Rent" cards that might exist in the player's hand
    player.hand = [card for card in player.hand if card.name != "Double The Rent"]
    return player, rent_card, game

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
    # Remove any "Just Say No" cards that might exist in the players' hands
    player_1.hand = [card for card in player_1.hand if card.name != "Just Say No"]
    player_2.hand = [card for card in player_2.hand if card.name != "Just Say No"]
    # Remove any "Double The Rent" cards that might exist in the players' hands
    player_1.hand = [card for card in player_1.hand if card.name != "Double The Rent"]
    player_2.hand = [card for card in player_2.hand if card.name != "Double The Rent"]

    return game, player_1, player_2

# Test 1: Execute Rent with valid charge
def test_rent_valid_charge(players_with_properties, player_with_rent):
    game, player_1, player_2 = players_with_properties
    player, rent_card, _ = player_with_rent

    # Mock input for Rent execution
    with patch('builtins.input', side_effect=['play', '0', 'property', 'blue', '0', 'y']):
        action = Rent(player, game)
        result = action.execute(rent_card)

        # Check if the rent was charged correctly
        assert result is True
        if 'blue' in player_2.properties:
            assert len(player_2.properties['blue']) == 0
        assert 'blue' in player_1.properties

# Test 2: Rent action canceled by player
def test_rent_canceled(player_with_rent):
    player, rent_card, game = player_with_rent

    # Mock input to simulate player choosing 'cancel'
    with patch('builtins.input', return_value='cancel'):
        action = Rent(player, game)
        result = action.execute(rent_card)

        # Ensure the Rent card remains in the hand and action is not played
        assert result is False
        assert rent_card in player.hand

# Test 3: No properties available to charge rent
def test_rent_no_properties_to_charge(game_setup, player_with_rent, capsys):
    game = game_setup
    player, rent_card, _ = player_with_rent

    # Remove all properties from the player
    player.properties = {}

    # Mock inputs for Rent action
    with patch('builtins.input', side_effect=['play']):
        action = Rent(player, game)
        result = action.execute(rent_card)

        # Validate that the rent charge was canceled
        assert result is False
        assert "has no properties matching the rent card colors" in capsys.readouterr().out.lower()

# Test 4: Rent charge with "Just Say No" blocking action
def test_rent_with_just_say_no_block(players_with_properties, player_with_rent):
    game, player_1, player_2 = players_with_properties
    player, rent_card, _ = player_with_rent

    # Add a "Just Say No" card to player_2's hand to block rent
    jsn_card = ActionCard("Just Say No", 4)
    player_2.hand.append(jsn_card)
    
    initial_bank_1 = player_1.bank[:]
    initial_properties_1 = {color: cards[:] for color, cards in player_1.properties.items()}
    initial_bank_2 = player_2.bank[:]
    initial_properties_2 = {color: cards[:] for color, cards in player_2.properties.items()}

    # Mock inputs for Rent action with blocking scenario
    with patch('builtins.input', side_effect=['play', '0', 'y']):
        action = Rent(player, game)
        result = action.execute(rent_card)

        # Check if the Rent card was blocked by "Just Say No"
        assert result is True  # Rent is blocked by "Just Say No"
        assert jsn_card not in player_2.hand  # Just Say No card should be used
        assert (player_1.bank == initial_bank_1 and player_1.properties == initial_properties_1) and (player_2.bank == initial_bank_2 and player_2.properties == initial_properties_2) # No money transferred

# Test 5: Rent action blocked by player choosing not to counter
def test_rent_blocked_by_counter_choice(players_with_properties, player_with_rent):
    game, player_1, player_2 = players_with_properties
    player, rent_card, _ = player_with_rent

    # Add a "Just Say No" card to player_1 and player_2's hands to block rent
    jsn_card_1 = ActionCard("Just Say No", 4)
    player_1.hand.append(jsn_card_1)
    jsn_card_2 = ActionCard("Just Say No", 4)
    player_2.hand.append(jsn_card_2)
    
    initial_bank_1 = player_1.bank[:]
    initial_properties_1 = {color: cards[:] for color, cards in player_1.properties.items()}
    initial_bank_2 = player_2.bank[:]
    initial_properties_2 = {color: cards[:] for color, cards in player_2.properties.items()}

    # Mock inputs for Rent action with blocking scenario
    with patch('builtins.input', side_effect=['play', '0', 'y', 'n']):
        action = Rent(player, game)
        result = action.execute(rent_card)

        # Check if the Rent card was blocked by "Just Say No"
        assert result is True  # Rent is blocked by "Just Say No"
        assert jsn_card_1 in player_1.hand  # Just Say No card should not be used
        assert jsn_card_2 not in player_2.hand  # Just Say No card should be used
        assert (player_1.bank == initial_bank_1 and player_1.properties == initial_properties_1) and (player_2.bank == initial_bank_2 and player_2.properties == initial_properties_2) # No money transferred

# Test 6: Rent action with wild card, selecting target player
def test_rent_wild_card(players_with_properties, player_with_rent):
    game, player_1, player_2 = players_with_properties
    player, rent_card, _ = player_with_rent
    player.hand.remove(rent_card)

    # Make Rent card wild
    wild_rent = RentCard(['brown', 'mint', 'light blue', 'pink', 'orange', 'red', 'yellow', 'green', 'blue', 'black'], 3, True)
    player.hand.append(wild_rent)

    # Mock input to select target player for wild Rent card
    with patch('builtins.input', side_effect=['play', '1', '0', 'property', 'blue', '0', 'y']):
        action = Rent(player, game)
        result = action.execute(wild_rent)

        # Verify that rent is charged to the selected target player
        assert result is True
        if 'blue' in player_2.properties:
            assert len(player_2.properties['blue']) == 0
        assert 'blue' in player_1.properties

# Test 7: Rent action with no available rent to charge (wild card with no matching properties)
def test_rent_wild_no_matching_properties(players_with_properties, player_with_rent, capsys):
    game, player_1, player_2 = players_with_properties
    player, rent_card, _ = player_with_rent
    player.hand.remove(rent_card)

    # Make Rent card wild but player has no matching properties
    wild_rent = RentCard(['brown', 'mint', 'light blue', 'pink', 'orange', 'red', 'yellow', 'green', 'blue', 'black'], 3, True)
    player.hand.append(wild_rent)
    player.properties = {}

    # Mock input to select target player for wild Rent card
    with patch('builtins.input', side_effect=['play', '1']):  # target_player selection happens before property verification
        action = Rent(player, game)
        result = action.execute(wild_rent)

        # Check if the wild Rent card couldn't charge rent due to no matching properties
        assert result is False
        assert "has no properties matching the rent card colors" in capsys.readouterr().out.lower()

# Test 8: Rent action with a third player having money in the bank
def test_rent_with_money_in_bank(players_with_properties, game_setup):
    game, player_1, player_2 = players_with_properties
    
    rent_card = RentCard(['red', 'yellow'], 1)
    player_1.hand.append(rent_card)

    # Create a new player with money in the bank
    new_player = Player("New Player")
    new_player.bank = [MoneyCard(5)]
    game.players.append(new_player)  # Add the new player to the game
    
    # Remove any "Just Say No" cards that might exist in the new_player's hand
    new_player.hand = [card for card in new_player.hand if card.name != "Just Say No"]

    # Mock input for Rent action on 'red' properties
    with patch('builtins.input', side_effect=['play', '0', 'property', 'blue', '0', 'y', 'bank', '0', 'y']):
        action = Rent(player_1, game)
        result = action.execute(rent_card)

    # Check that the rent was successfully charged
    assert result is True
    # Verify that rent is charged to all players
    assert 'blue' in player_1.properties
    if 'blue' in player_2.properties:
        assert len(player_2.properties['blue']) == 0
    assert any(isinstance(card, MoneyCard) and card.value == 5 for card in player_1.bank)
    assert not any(isinstance(card, MoneyCard) and card.value == 5 for card in new_player.bank)

# Test 9: Rent action with insufficient funds (property payment)
def test_rent_insufficient_funds_with_property(players_with_properties, player_with_rent, capsys):
    game, player_1, player_2 = players_with_properties
    player, rent_card, _ = player_with_rent
    
    player.properties["red"] = [properties.red1, properties.red2, properties.red3]
    
    # Mock input for Rent action
    with patch('builtins.input', side_effect=['play', '0', 'property', 'blue', '0']):
        action = Rent(player, game)
        result = action.execute(rent_card)
    
    # Ensure that rent is charged
    assert result is True
    if 'blue' in player_2.properties:
        assert len(player_2.properties['blue']) == 0
    assert 'blue' in player_1.properties

# Test 10: Rent action with insufficient funds due to multicolor wild property (bank payment)
def test_rent_insufficient_funds_with_bank(players_with_properties, player_with_rent, capsys):
    game, player_1, player_2 = players_with_properties
    player, rent_card, _ = player_with_rent
    
    player.properties["red"] = [properties.red1, properties.red2, properties.red3]
    player_2.properties = {properties.wild_multicolor1.current_color: [properties.wild_multicolor1]}
    player_2.bank.append(MoneyCard(5))
    
    # Mock input for Rent action
    with patch('builtins.input', side_effect=['play', '0', 'bank', '0']):
        action = Rent(player, game)
        result = action.execute(rent_card)
    
    # Ensure that rent is charged
    assert result is True
    assert any(isinstance(card, MoneyCard) and card.value == 5 for card in player_1.bank)
    assert not any(isinstance(card, MoneyCard) and card.value == 5 for card in player_2.bank)

# Test 11: Rent action against a player that has nothing to pay
def test_rent_against_player_with_nothing_to_pay(players_with_properties, player_with_rent):
    game, player_1, player_2 = players_with_properties
    player, rent_card, _ = player_with_rent
    
    player_2.bank = []
    player_2.properties = {}
    
    # Mock Input for Rent execution
    with patch('builtins.input', side_effect=['play', '0']):
        action = Rent(player, game)
        result = action.execute(rent_card)
    
    assert result is True

# Test 12: Rent action against a player with a multicolor wild card only
def test_rent_against_player_with_multicolor_wild_card_only(players_with_properties, player_with_rent):
    game, player_1, player_2 = players_with_properties
    player, rent_card, _ = player_with_rent
    
    player_2.bank = []
    player_2.properties = {properties.wild_multicolor1.current_color: [properties.wild_multicolor1]}
    
    # Mock Input for Rent execution
    with patch('builtins.input', side_effect=['play', '0']):
        action = Rent(player, game)
        result = action.execute(rent_card)
    
    assert result is True

# Test 13: Rent action with "Double The Rent" card
def test_rent_with_double_the_rent(players_with_properties, player_with_rent):
    game, player_1, player_2 = players_with_properties
    player, rent_card, _ = player_with_rent

    # Add "Double The Rent" card to Player 1's hand
    double_rent_card = ActionCard("Double The Rent", 1)
    player_1.hand.append(double_rent_card)

    player_2.bank = [MoneyCard(2)]

    # Mock input for Rent execution
    with patch('builtins.input', side_effect=['play', 'y', '0', 'property', 'blue', '0', 'y', 'bank', '0', 'y']):
        action = Rent(player, game)
        result = action.execute(rent_card)

    # Ensure the Rent card is charged with double the rent
    assert result is True
    assert not player_2.bank
    assert player_1.bank
    if 'blue' in player_2.properties:
        assert len(player_2.properties['blue']) == 0
    assert 'blue' in player_1.properties
    # Ensure "Double The Rent" card is discarded
    assert rent_card not in player_1.hand
    assert double_rent_card not in player_1.hand

# Test 14: Double Rent should not be applied after actions used up
def test_rent_with_double_the_rent_after_all_actions(players_with_properties, player_with_rent):
    game, player_1, player_2 = players_with_properties
    player, rent_card, _ = player_with_rent

    # Add "Double The Rent" card to Player 1's hand
    double_rent_card = ActionCard("Double The Rent", 4)
    player_1.hand.append(double_rent_card)
    player_2.bank = [MoneyCard(2)]

    # Mock input to simulate using all actions (let's assume they use 2 actions already)
    game.actions = 2  # All actions used
    with patch('builtins.input', side_effect=['play', '0', 'property', 'blue', '0', 'y', 'bank', '0', 'y']):
        action = Rent(player, game)
        result = action.execute(rent_card)

    # Ensure the Rent action is executed without doubling rent since all actions are used
    assert result is True
    assert player_2.bank
    assert not player_1.bank
    if 'blue' in player_2.properties:
        assert len(player_2.properties['blue']) == 0
    assert 'blue' in player_1.properties
    assert rent_card not in player_1.hand
    # Ensure "Double The Rent" card is still in hand
    assert double_rent_card in player_1.hand

# Test 15: "Double The Rent" card cancelled by player
def test_rent_with_double_the_rent_cancelled(players_with_properties, player_with_rent):
    game, player_1, player_2 = players_with_properties
    player, rent_card, _ = player_with_rent

    # Add "Double The Rent" card to Player 1's hand
    double_rent_card = ActionCard("Double The Rent", 4)
    player_1.hand.append(double_rent_card)
    player_2.bank = [MoneyCard(2)]

    # Mock input to simulate using all actions (let's assume they use 2 actions already)
    game.actions = 2  # All actions used
    with patch('builtins.input', side_effect=['play', 'n', '0', 'property', 'blue', '0', 'y', 'bank', '0', 'y']):
        action = Rent(player, game)
        result = action.execute(rent_card)

    # Ensure the Rent action is executed without doubling rent since all actions are used
    assert result is True
    assert player_2.bank
    assert not player_1.bank
    if 'blue' in player_2.properties:
        assert len(player_2.properties['blue']) == 0
    assert 'blue' in player_1.properties
    assert rent_card not in player_1.hand
    # Ensure "Double The Rent" card is still in hand
    assert double_rent_card in player_1.hand

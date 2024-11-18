import pytest
from unittest.mock import patch
from game.actions.house import House
from game.card import ActionCard, PropertyCard
from game.player import Player
from game.game import Game
from constants import properties

@pytest.fixture
def game_setup():
    """Fixture to set up a basic game environment with one player."""
    game = Game(["Player 1"])
    return game

@pytest.fixture
def player_with_complete_set(game_setup):
    """Fixture to set up a player with a complete property set for 'red'."""
    game = game_setup
    player = game.players[0]
    player.properties = {
        "red": [properties.red1, properties.red2, properties.red3],  # Complete set for 'red'
        "blue": [properties.blue1]  # Incomplete set for 'blue'
    }
    house_card = ActionCard("House", 3)  # Example House card
    player.hand.append(house_card)
    return player, house_card, game

@pytest.fixture
def player_with_no_complete_set(game_setup):
    """Fixture to set up a player with no complete property sets."""
    game = game_setup
    player = game.players[0]
    player.properties = {
        "blue": [properties.blue1],  # Incomplete set
        "green": [properties.green1, properties.green2]  # Incomplete set
    }
    house_card = ActionCard("House", 3)
    player.hand.append(house_card)
    return player, house_card, game

# Test 1: Test adding a house to a complete property set
def test_add_house_to_complete_set(player_with_complete_set):
    player, house_card, game = player_with_complete_set

    # Mock the input to simulate the player choosing to add the house to the 'red' set
    with patch('builtins.input', return_value='0'):
        result = House(player, game).execute(house_card)
        
        # Check if the house was added to the correct property set
        assert house_card in player.properties["red"]
        assert house_card not in player.hand
        assert result is True  # The action was successfully played

# Test 2: Test banking the House card when no complete sets are eligible
def test_bank_house_with_no_complete_set(player_with_no_complete_set):
    player, house_card, game = player_with_no_complete_set

    # Mock the input to simulate the player choosing to bank the House card
    with patch('builtins.input', return_value='bank'):
        result = House(player, game).execute(house_card)
        
        # Check if the House card was moved to the bank
        assert house_card in player.bank
        assert house_card not in player.hand
        assert result is True  # The action was successfully completed

# Test 3: Test canceling the House action when no eligible property sets
def test_cancel_house_with_no_complete_set(player_with_no_complete_set):
    player, house_card, game = player_with_no_complete_set

    # Mock the input to simulate the player choosing to cancel
    with patch('builtins.input', return_value='cancel'):
        result = House(player, game).execute(house_card)
        
        # Check that the House card remains in the hand and nothing else changes
        assert house_card in player.hand
        assert house_card not in player.bank
        assert result is False  # The action was canceled

# Test 4: Test invalid input handling for House action
def test_invalid_input_for_house_action(player_with_complete_set):
    player, house_card, game = player_with_complete_set

    # Mock the input to simulate invalid input followed by a valid choice
    with patch('builtins.input', side_effect=['invalid', '0']):
        result = House(player, game).execute(house_card)
        
        # Check if the house was added to the correct property set after invalid input
        assert house_card in player.properties["red"]
        assert house_card not in player.hand
        assert result is True  # The action was successfully played

# Test 5: Test adding a house when eligible set already contains a house
def test_house_not_added_if_already_present_with_cancel_or_bank(player_with_complete_set):
    player, house_card, game = player_with_complete_set

    # Add a house to the 'red' set manually to make it ineligible for another house
    player.properties["red"].append(ActionCard("House", 3))

    # Test the `cancel` option
    with patch('builtins.input', return_value='cancel'):
        result_cancel = House(player, game).execute(house_card)

        # Check that the house card is still in the player's hand (was not banked or added to properties)
        assert house_card in player.hand
        # Ensure action was canceled
        assert result_cancel is False  

    # Test the `bank` option
    with patch('builtins.input', return_value='bank'):
        result_bank = House(player, game).execute(house_card)

        # Check that the house card is now in the bank, not in the hand or property set
        assert house_card in player.bank
        assert house_card not in player.hand
        assert result_bank is True  # Action was completed by banking the card

# Test 6: Test multiple complete sets eligible for House
def test_multiple_complete_sets(player_with_complete_set):
    player, house_card, game = player_with_complete_set

    # Add a second complete set to make multiple eligible
    player.properties["green"] = [properties.green1, properties.green2, properties.green3]

    # Mock the input to simulate choosing the 'green' set (index 1)
    with patch('builtins.input', return_value='1'):
        result = House(player, game).execute(house_card)

        # Check if the house was added to the correct property set (green)
        assert house_card in player.properties["green"]
        assert house_card not in player.hand
        assert result is True  # The action was successfully played

# Test 7: Test incomplete property set becomes complete
def test_set_becomes_complete(player_with_no_complete_set):
    player, house_card, game = player_with_no_complete_set

    # Complete the 'green' set during the test
    player.properties["green"].append(properties.green3)

    # Mock the input to simulate choosing the 'green' set
    with patch('builtins.input', return_value='0'):
        result = House(player, game).execute(house_card)

        # Check if the house was added to the 'green' set
        assert house_card in player.properties["green"]
        assert house_card not in player.hand
        assert result is True  # The action was successfully played

# Test 8: Test when player has no properties
def test_no_properties(player_with_no_complete_set):
    player, house_card, game = player_with_no_complete_set
    player.properties = {}  # Clear properties to simulate no properties owned

    with patch('builtins.input', return_value='cancel'):
        result = House(player, game).execute(house_card)
        
        # Check the House card remains in the hand and no action taken
        assert house_card in player.hand
        assert result is False  # Action was canceled as there were no eligible sets

# Test 9: Test repeated cancel and bank choices
def test_cancel_then_bank_house_card(player_with_no_complete_set):
    player, house_card, game = player_with_no_complete_set

    # First attempt: player cancels the action
    with patch('builtins.input', return_value='cancel'):
        result = House(player, game).execute(house_card)
        # Verify that the card is not banked and action was canceled
        assert house_card in player.hand
        assert house_card not in player.bank
        assert result is False

    # Second attempt: player chooses to bank the card
    with patch('builtins.input', return_value='bank'):
        result = House(player, game).execute(house_card)
        # Verify that the card is now banked
        assert house_card not in player.hand
        assert house_card in player.bank
        assert result is True

        
# Test 10: Test adding House to each color in eligible multiple complete sets
def test_add_house_to_each_eligible_set(player_with_complete_set):
    player, house_card, game = player_with_complete_set
    # Add multiple complete sets for eligibility
    player.properties["green"] = [properties.green1, properties.green2, properties.green3]
    player.properties["yellow"] = [properties.yellow1, properties.yellow2, properties.yellow3]

    # Test adding a house to each eligible set
    for i, color in enumerate(["red", "green", "yellow"]):
        with patch('builtins.input', return_value=str(i)):
            result = House(player, game).execute(house_card)
            
            # Verify House is added to the chosen set
            assert house_card in player.properties[color]
            assert result is True
            # Remove the house card to reset for the next iteration
            player.properties[color].remove(house_card)
            player.hand.append(house_card)  # Return card to hand for next loop

# Test 11: Test adding a house to a black property set
def test_add_house_to_black_set(player_with_complete_set):
    player, house_card, game = player_with_complete_set
    
    # Add a complete black set to the player’s properties
    player.properties = {}
    player.properties["black"] = [properties.black1, properties.black2, properties.black3, properties.black4]

    # 'bank' since the black set should not show up in eligible sets
    with patch('builtins.input', return_value='bank'):
        result = House(player, game).execute(house_card)

        # Check if the house was added to the black property set
        assert house_card not in player.properties["black"]
        assert house_card in player.bank
        assert result is True

# Test 12: Test adding a house to a mint property set
def test_add_house_to_mint_set(player_with_complete_set):
    player, house_card, game = player_with_complete_set
    
    # Add a complete mint set to the player’s properties
    player.properties = {}
    player.properties["mint"] = [properties.mint1, properties.mint2]

    # 'bank' since the mint set should not show up in eligible sets
    with patch('builtins.input', return_value='bank'):
        result = House(player, game).execute(house_card)

        # Check if the house was added to the mint property set
        assert house_card not in player.properties["mint"]
        assert house_card in player.bank
        assert result is True

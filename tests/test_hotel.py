import pytest
from unittest.mock import patch
from game.actions.hotel import Hotel
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
    hotel_card = ActionCard("Hotel", 4)  # Example House card
    player.hand.append(hotel_card)
    return player, hotel_card, game

@pytest.fixture
def player_with_no_complete_set(game_setup):
    """Fixture to set up a player with no complete property sets."""
    game = game_setup
    player = game.players[0]
    player.properties = {
        "blue": [properties.blue1],  # Incomplete set
        "green": [properties.green1, properties.green2]  # Incomplete set
    }
    hotel_card = ActionCard("Hotel", 4)
    player.hand.append(hotel_card)
    return player, hotel_card, game

# Test 1: Test adding a hotel to a complete property set with a house already present
def test_add_hotel_to_complete_set_with_house(player_with_complete_set):
    player, hotel_card, game = player_with_complete_set

    # Manually add a house to the 'red' set to make it eligible for a hotel
    player.properties["red"].append(ActionCard("House", 3))

    # Mock the input to simulate the player choosing to add the hotel to the 'red' set
    with patch('builtins.input', return_value='0'):
        result = Hotel(player, game).execute(hotel_card)

        # Check if the hotel was added to the correct property set
        assert hotel_card in player.properties["red"]
        assert hotel_card not in player.hand
        assert result is True  # The action was successfully played

# Test 2: Test banking the Hotel card when no complete sets with a house are eligible
def test_bank_hotel_with_no_complete_set(player_with_no_complete_set):
    player, hotel_card, game = player_with_no_complete_set

    # Mock the input to simulate the player choosing to bank the Hotel card
    with patch('builtins.input', return_value='bank'):
        result = Hotel(player, game).execute(hotel_card)
        
        # Check if the Hotel card was moved to the bank
        assert hotel_card in player.bank
        assert hotel_card not in player.hand
        assert result is True  # The action was successfully completed

# Test 3: Test canceling the Hotel action when no eligible property sets
def test_cancel_hotel_with_no_complete_set(player_with_no_complete_set):
    player, hotel_card, game = player_with_no_complete_set

    # Mock the input to simulate the player choosing to cancel
    with patch('builtins.input', return_value='cancel'):
        result = Hotel(player, game).execute(hotel_card)
        
        # Check that the Hotel card remains in the hand and nothing else changes
        assert hotel_card in player.hand
        assert hotel_card not in player.bank
        assert result is False  # The action was canceled

# Test 4: Test invalid input handling for Hotel action
def test_invalid_input_for_hotel_action(player_with_complete_set):
    player, hotel_card, game = player_with_complete_set

    # Manually add a house to make the 'red' set eligible for a hotel
    player.properties["red"].append(ActionCard("House", 3))

    # Mock the input to simulate invalid input followed by a valid choice
    with patch('builtins.input', side_effect=['invalid', '0']):
        result = Hotel(player, game).execute(hotel_card)
        
        # Check if the hotel was added to the correct property set after invalid input
        assert hotel_card in player.properties["red"]
        assert hotel_card not in player.hand
        assert result is True  # The action was successfully played

# Test 5: Test adding a hotel when eligible set already contains a hotel
def test_hotel_not_added_if_already_present_with_cancel_or_bank(player_with_complete_set):
    player, hotel_card, game = player_with_complete_set

    # Add both a house and a hotel to make the 'red' set ineligible for another hotel
    player.properties["red"].append(ActionCard("House", 3))
    player.properties["red"].append(ActionCard("Hotel", 4))

    # Test the `cancel` option
    with patch('builtins.input', return_value='cancel'):
        result_cancel = Hotel(player, game).execute(hotel_card)

        # Check that the hotel card is still in the player's hand
        assert hotel_card in player.hand
        assert result_cancel is False  # Action was canceled

    # Test the `bank` option
    with patch('builtins.input', return_value='bank'):
        result_bank = Hotel(player, game).execute(hotel_card)

        # Check that the hotel card is now in the bank
        assert hotel_card in player.bank
        assert hotel_card not in player.hand
        assert result_bank is True  # Action was completed by banking the card

# Test 6: Test multiple complete sets eligible for Hotel
def test_multiple_complete_sets_for_hotel(player_with_complete_set):
    player, hotel_card, game = player_with_complete_set

    # Add a house to both sets to make them eligible for a hotel
    player.properties["red"].append(ActionCard("House", 3))
    player.properties["green"] = [properties.green1, properties.green2, properties.green3]
    player.properties["green"].append(ActionCard("House", 3))

    # Mock the input to simulate choosing the 'green' set (index 1)
    with patch('builtins.input', return_value='1'):
        result = Hotel(player, game).execute(hotel_card)

        # Check if the hotel was added to the correct property set
        assert hotel_card in player.properties["green"]
        assert hotel_card not in player.hand
        assert result is True  # The action was successfully played

# Test 7: Test incomplete property set becomes complete for hotel eligibility
def test_set_becomes_complete_for_hotel(player_with_no_complete_set):
    player, hotel_card, game = player_with_no_complete_set

    # Complete the 'green' set and add a house during the test
    player.properties["green"].extend([properties.green3, ActionCard("House", 3)])

    # Mock the input to simulate choosing the 'green' set
    with patch('builtins.input', return_value='0'):
        result = Hotel(player, game).execute(hotel_card)

        # Check if the hotel was added to the 'green' set
        assert hotel_card in player.properties["green"]
        assert hotel_card not in player.hand
        assert result is True  # The action was successfully played

# Test 8: Test when player has no properties for hotel action
def test_no_properties_for_hotel_action(player_with_no_complete_set):
    player, hotel_card, game = player_with_no_complete_set
    player.properties = {}  # Clear properties to simulate no properties owned

    with patch('builtins.input', return_value='cancel'):
        result = Hotel(player, game).execute(hotel_card)
        
        # Check the Hotel card remains in the hand and no action taken
        assert hotel_card in player.hand
        assert result is False  # Action was canceled as there were no eligible sets

# Test 9: Test repeated cancel and bank choices for hotel card
def test_cancel_then_bank_hotel_card(player_with_no_complete_set):
    player, hotel_card, game = player_with_no_complete_set

    # First attempt: player cancels the action
    with patch('builtins.input', return_value='cancel'):
        result = Hotel(player, game).execute(hotel_card)
        assert hotel_card in player.hand  # Card remains in hand
        assert result is False

    # Second attempt: player chooses to bank the card
    with patch('builtins.input', return_value='bank'):
        result = Hotel(player, game).execute(hotel_card)
        assert hotel_card not in player.hand  # Card moved to bank
        assert hotel_card in player.bank
        assert result is True

# Test 10: Test adding Hotel to each color in eligible multiple complete sets
def test_add_hotel_to_each_eligible_set(player_with_complete_set):
    player, hotel_card, game = player_with_complete_set
    # Add multiple complete sets with houses for eligibility
    player.properties["green"] = [properties.green1, properties.green2, properties.green3, ActionCard("House", 3)]
    player.properties["yellow"] = [properties.yellow1, properties.yellow2, properties.yellow3, ActionCard("House", 3)]

    # Test adding a hotel to each eligible set
    for i, color in enumerate(["green", "yellow"]):
        with patch('builtins.input', return_value=str(i)):
            result = Hotel(player, game).execute(hotel_card)
            assert hotel_card in player.properties[color]
            assert result is True
            player.properties[color].remove(hotel_card)
            player.hand.append(hotel_card)  # Reset card for next loop

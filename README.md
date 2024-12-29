# MonopolyDeal

### Updates:

- Implemented user authentication, login, and registration
- Implemented user settings page: change username, change password, delete account
- Implemented game room creation and joining
- Designed card components
- Implemented displaying player cards, bank, and properties (2-player only)

### Complete:

#### **GAMEPLAY LOGIC COMPLETE!**

- Charted out logic for player.py, taking care of their hand, properties, and bank
- Added wild property card functionality
- 11 actions now supported: Pass Go, House, Hotel, Sly Deal, Forced Deal, Deal Breaker, Rent, Debt Collector, It's Your Birthday, Double The Rent, and Just Say No
- Implemented test cases for all actions created

### Next steps:

- Continue game - connect frontend to backend as you go along
- Start working on drag and drop onto bank -> properties -> action pile
- Modify MainGame to allow for multiple players
- Potentially display all the games the user is active (game codes) in in the GameRoom.js page.

### Potential issues:

- Some rooms may have players in them even though websockets have been closed - REASON UNKNOWN
- User may be logged in but not authenticated and thus, unable to create a game - REASON: JWT token expiration

### Deviations from official Monopoly Deal rules:

- In the official Monopoly Deal rules, houses and hotels lose their monetary value when added to property sets. If an entire property set is given to another player (e.g., due to a rent action), the houses and hotels are included with the set. In this game, however, houses and hotels retain their monetary value even when placed on property sets and can be used as payment. Note, however, if a property set contains both a house and a hotel and only the house is used for payment, the hotel is automatically moved to the player's bank.

- In the official Monopoly Deal rules, a multicolor wild card cannot be used to charge rent if it is the only card in a player's possession. However, to make the game more exciting, this restriction is relaxed, allowing rent to be charged even if the multicolor wild card is the only card available.

- In the official Monopoly Deal rules, if the deck runs out, the discard pile is shuffled back into the deck to continue the game. However, this feature has not been implemented yet.

# MonopolyDeal

### Updates:

- Implemented user authentication, login, and registration
- Implemented user settings page: change username, change password, delete account
- Implemented game room creation and joining
- Designed card components
- Implemented displaying player cards, bank, and properties (2-player only)
- Implemented card dragging and dropping onto the bank, properties, and action pile
- Implemented bank and property area additions
- Implemented pass go, it's your birthday, debt collector, rent, sly deal, and forced deal actions

### Complete:

#### **GAMEPLAY LOGIC COMPLETE!**

- Charted out logic for player.py, taking care of their hand, properties, and bank
- Added wild property card functionality
- 11 actions now supported: Pass Go, House, Hotel, Sly Deal, Forced Deal, Deal Breaker, Rent, Debt Collector, It's Your Birthday, Double The Rent, and Just Say No
- Implemented test cases for all actions created

### Next steps:

- Continue game - connect frontend to backend as you go along
- Modify MainGame to allow for multiple players
- Potentially display all the games the user is active (game codes) in in the GameRoom.js page.
- Fix 'card being cut while dragging' in Safari
- Fix the hover state persisting after an invalid drop, resetting it without requiring a new hover
- Bring back the fan effect for opponent's cards
- Implement Deal Breaker, Double The Rent, and Just Say No
- Improve the animation displayed in the background highlighting the action that's been played
- Potentially elevate the placement of card notification if an error is already being displayed, so they don't overlap
- Implement smooth card going from deck to player's hand animation for picking up any cards at the start of their turn / pass go
- Block other drop zones when a card is in play (for instance, if I am adding a house to a property, I shouldn't be able to drop a card in bank)
- Fix the case where a user presses the back button on game screen and is taken to the waiting room - close the connection and take them home instead
- Implement a feature within rent requests that shows what was given by the player as rent / if a player couldn't pay rent because they didn't have any more to give
- Fix the "card is null" error that randomly appears and is likely some problem in CardNotification
- Fix the case where a player has no bank/property cards to pay for rent
- Fix the issue where if a player pays rent in less than 2 seconds, then the "Collecting Rent..." animation doesn't go away for the rent requesting user
- Fix rent amount issues with wild cards, houses, and hotels
- Check responsiveness of all components, overlays, pages, and animations
- Implement checks such that a player should not be able to play sly deal if none of the opponents have any properties
- Fix sly deal and forced deal to not allow players to steal from opponents' full property sets
- Fix the issue where when a rent card is played into the action pile, the displayed rent card in the action pile does not show rent colors

### Potential issues:

- Some rooms may have players in them even though websockets have been closed - REASON UNKNOWN
- User may be logged in but not authenticated and thus, unable to create a game - REASON: JWT token expiration

### Deviations from official Monopoly Deal rules:

- In the official Monopoly Deal rules, houses and hotels lose their monetary value when added to property sets. If an entire property set is given to another player (e.g., due to a rent action), the houses and hotels are included with the set. In this game, however, houses and hotels retain their monetary value even when placed on property sets and can be used as payment. Note, however, if a property set contains both a house and a hotel and only the house is used for payment, the hotel is automatically moved to the player's bank.

- In the official Monopoly Deal rules, a multicolor wild card cannot be used to charge rent if it is the only card in a player's possession. However, to make the game more exciting, this restriction is relaxed, allowing rent to be charged even if the multicolor wild card is the only card available.

- In the official Monopoly Deal rules, if the deck runs out, the discard pile is shuffled back into the deck to continue the game. However, this feature has not been implemented yet.

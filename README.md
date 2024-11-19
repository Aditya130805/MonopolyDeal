# MonopolyDeal

### Updates:

- Charted out logic for player.py, taking care of their hand, properties, and bank
- Added wild property card functionality
- 8 actions now supported: Pass Go, House, Hotel, Sly Deal, Forced Deal, Deal Breaker, Rent, and Debt Collector
- Implemented test cases for all actions created

### Next steps:

- Implement more actions: Just Say No - within the non-implemented actions, Double the Rent, and It's My Birthday
- Implement logic to ensure that player's hands cannot contain more than 7 cards at the end of their turn

### Deviations from official Monopoly Deal rules:

- In the official Monopoly Deal rules, houses and hotels lose their monetary value when added to property sets. If an entire property set is given to another player (e.g., due to a rent action), the houses and hotels are included with the set. In this game, however, houses and hotels retain their monetary value even when placed on property sets and can be used as payment. Note, however, if a property set contains both a house and a hotel and only the house is used for payment, the hotel is automatically moved to the player's bank.

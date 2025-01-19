# MonopolyDeal

## **Deployment Overview**

- **Backend:** Successfully deployed to [Railway.app](https://railway.app) using a GitHub monorepo. The backend utilizes a **PostgreSQL database** to store user information and **Redis** for in-game memory management.
- **Frontend:** Deployed to [Vercel](https://vercel.com) via the same GitHub monorepo.
- **Live Version:** You can access the live version of the game at [Monopoly Deal Digital](https://deal-frontend-psi.vercel.app).

## Next steps / Issues to resolve:

#### Gameplay Features/Enhancements:

- Modify MainGame to allow for multiple players
- Implement "Just Say No" functionality
- Allow a user to choose which color they want to turn a wild property into if they steal it via sly deal / forced deal or receive it as part of any rent (it's your birthday / debt collector / rent / multicolor rent)
- Potentially display all the games the user is active (game codes) in in the GameRoom.js page.

#### UI/UX Improvements:

- Fix 'card being cut while dragging' in Safari
- Fix the hover state persisting after an invalid drop, resetting it without requiring a new hover
- Bring back the fan effect for opponent's cards
- Implement smooth card going from deck to player's hand animation for picking up any cards at the start of their turn / pass go
- Check responsiveness of all components, overlays, pages, and animations
- Add an animation when loading the game page after clicking "Start Game"

#### Bug Fixes:

- Potentially elevate the placement of card notification if an error is already being displayed, so they don't overlap
- Fix the case where a user presses the back button on game screen and is taken to the waiting room - close the connection and take them home instead
- Fix the "card is null" error that randomly appears and is likely some problem in CardNotification
- Some rooms may have players in them even though websockets have been closed - REASON UNKNOWN
- User may be logged in but not authenticated and thus, unable to create a game - REASON: JWT token expiration
- Let's say we make 5 blue property cards, then the 3rd set is not being shown in the properties area

## Deviations from official Monopoly Deal rules:

- In the official Monopoly Deal rules, houses and hotels lose their monetary value when added to property sets. If an entire property set is given to another player (e.g., due to a rent action), the houses and hotels are included with the set. In this game, however, houses and hotels retain their monetary value even when placed on property sets and can be used as payment. Note, however, if a property set contains both a house and a hotel and only the house is used for payment, the hotel is automatically moved to the player's bank.

- In the official Monopoly Deal rules, a multicolor wild card cannot be used to charge rent if it is the only card in a player's possession. However, to make the game more exciting, this restriction is relaxed, allowing rent to be charged even if the multicolor wild card is the only card available.

- In the official Monopoly Deal rules, if the deck runs out, the discard pile is shuffled back into the deck to continue the game. However, this feature has not been implemented yet.

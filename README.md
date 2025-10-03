# Cardopoly

## **Deployment Overview**

- **Backend:** Successfully deployed to [Railway.app](https://railway.app) using a GitHub monorepo. The backend utilizes a **PostgreSQL database** to store user information and **Redis** for in-game memory management.
- **Frontend:** Deployed to [Vercel](https://vercel.com) via the same GitHub monorepo.
- **Live Version:** You can access the live version of the game at [Cardopoly](https://cardopoly.vercel.app).

## Next steps / Issues to resolve:

#### Gameplay Features/Enhancements:

- Modify MainGame to allow for multiple players
- Allow a user to choose which color they want to turn a wild property into if they steal it via sly deal / forced deal or receive it as part of any rent (it's your birthday / debt collector / rent / multicolor rent)
- Potentially display all the games the user is active (game codes) in in the GameRoom.js page.
- Potentially create a user stats page that shows all of their games played, win rate, lose rate, and more (possible with a database storing all games)
- Add an option on the victory and tie screens to re-play, i.e., go back to the same game room

#### UI/UX Improvements:

- Fix the hover state persisting after an invalid drop, resetting it without requiring a new hover
- Bring back the fan effect for opponent's cards
- Implement smooth card going from deck to player's hand animation for picking up any cards at the start of their turn / pass go
- Check responsiveness of all components, overlays, pages, and animations
- Add an animation when loading the game page after clicking "Start Game"
- Improve link sharing og:image preview
- Implement some sort of log to replace CardNotification

#### Bug Fixes:

- Elevate the placement of card notification if an error is already being displayed, so they don't overlap
- Fix the case where a user presses the back button on game screen and is taken to the waiting room - close the connection and take them home instead
- Some rooms may have players in them even though websockets have been closed - REASON UNKNOWN
- User may be logged in but not authenticated and thus, unable to create a game - REASON: JWT token expiration
- Let's say we make 5 blue property cards, then the 3rd set is not being shown in the properties area
- Using hard-coded public URL for og:image preview; make %PUBLIC_URL% work
- Double sign up potentially causes the server to crash; fix that

#### Multi-player bugs:

- OpponentSelectionModal shown even if it's only 2-players playing
- // TODO: Identify if house or hotel came from property or bank somehow in PaymentCardMovementAnimation.js
- If nothing to pay with, show something

## Deviations from official rules:

- In the official rules, houses and hotels lose their monetary value when added to property sets. If an entire property set is given to another player (e.g., due to a rent action), the houses and hotels are included with the set. In this game, however, houses and hotels retain their monetary value even when placed on property sets and can be used as payment. Note, however, if a property set contains both a house and a hotel and only the house is used for payment, the hotel is automatically moved to the player's bank.

- In the official rules, a multicolor wild card cannot be used to charge rent if it is the only card in a player's possession. However, to make the game more exciting, this restriction is relaxed, allowing rent to be charged even if the multicolor wild card is the only card available.

- In the official rules, if the deck runs out, the discard pile is shuffled back into the deck to continue the game. However, this feature has not been implemented yet.

- In the official rules, when a Just Say No card is played to counter "Double the Rent", the user is still required to pay rent. However, in this game, the user does not have to pay any rent at all if they play a Just Say No card to counter "Double the Rent".

## New changes

- (DONE) Shuffle players upon game start
- Some problem with rent
- (DONE) Display rent amount next to selection choices
- Fix 0 cards UI drop down
- Replay option to play with the same players in a game room
- (DONE) Same group starts game, previous victory overlay shows (fix this bug)
- (DONE) Prevent dragging cards if they play turn and turn is processing to manage turns properly
- If backend error, close that game room that caused it if possible and display something
- Send only ready state change or differential for ActiveGameRoom changes

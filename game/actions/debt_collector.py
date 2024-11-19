from game.actions.base_action import BaseAction
from game.card import ActionCard

class DebtCollector(BaseAction):
    def select_target_player(self):
        """Prompt the user to select a target player to charge debt."""
        print("\nPlayers available to collect debt from:")
        for i, player in enumerate(self.game.players):
            if player != self.player:
                print(f"{i}: {player.name}")

        while True:
            choice = input("Select a player to collect debt from (or type 'cancel' to cancel): ").strip()
            if choice.lower() == 'cancel':
                print("Target player selection cancelled.")
                return None

            try:
                choice = int(choice)
                target_player = self.game.players[choice]
                if target_player != self.player:
                    return target_player
                else:
                    print("You cannot select yourself.")
            except (ValueError, IndexError):
                print("Invalid choice. Please select a valid player.")

    def attempt_block_with_just_say_no(self, initiator, target_player):
        """Allows players to counter each other's 'Just Say No' cards until one side runs out or chooses not to play."""
        while True:
            # Check if the target player has a "Just Say No" card
            jsn_card = next((card for card in target_player.hand if card.name == "Just Say No"), None)
            if jsn_card:
                print(f"\n{target_player.name} has a 'Just Say No' card!")
                choice = input(f"{target_player.name}, do you want to play 'Just Say No' to block the Debt Collector? (y/n): ").strip().lower()
                if choice == 'y':
                    print(f"{target_player.name} plays 'Just Say No' to block the Debt Collector.")
                    target_player.hand.remove(jsn_card)

                    # Now check if the initiator has a "Just Say No" to counter
                    counter_jsn_card = next((card for card in initiator.hand if card.name == "Just Say No"), None)
                    if counter_jsn_card:
                        counter_choice = input(f"{initiator.name}, do you want to counter with another 'Just Say No'? (y/n): ").strip().lower()
                        if counter_choice == 'y':
                            print(f"{initiator.name} counters with 'Just Say No'.")
                            initiator.hand.remove(counter_jsn_card)
                            # Switch roles and continue the loop for another potential counter
                            initiator, target_player = target_player, initiator
                        else:
                            print(f"{initiator.name} chose not to counter. Debt Collector is blocked.")
                            return True  # Final block
                    else:
                        print(f"{initiator.name} has no 'Just Say No' to counter. Debt Collector is blocked.")
                        return True  # Blocked without counter
                else:
                    print(f"{target_player.name} chose not to block the Debt Collector. Debt Collector is not blocked.")
                    return False  # No block attempt
            else:
                print(f"{target_player.name} has no 'Just Say No' card. Debt Collector is not blocked.")
                return False  # No 'Just Say No' to block

    def execute(self, card):
        """Execute the Debt Collector action."""
        while True:
            choice = input(f"{self.player.name}, do you want to play the Debt Collector card, put it in the bank, or cancel? (play/bank/cancel): ").strip().lower()

            if choice == 'play':
                print(f"{self.player.name} plays Debt Collector!")
                target_player = self.select_target_player()
                if not target_player:
                    print("No target player selected. Debt Collector action cancelled.")
                    return False

                # Debt Collector has a fixed amount of $5
                debt_amount = 5

                # Allow target player to block the action with 'Just Say No'
                if self.attempt_block_with_just_say_no(self.player, target_player):
                    print(f"{self.player.name}'s Debt Collector was ultimately blocked by {target_player.name}'s 'Just Say No'.")
                    return True

                # Execute the payment if the action is not blocked
                print(f"{self.player.name} charges {target_player.name} ${debt_amount} using Debt Collector.")
                target_player.pay_to_player(debt_amount, self.player)

                self.game.discard_card(card)
                self.player.hand.remove(card)
                return True

            elif choice == 'bank':
                self.player.add_to_bank(card)
                print(f"{self.player.name} put Debt Collector card in the bank.")
                self.player.hand.remove(card)
                return True

            elif choice == 'cancel':
                print(f"{self.player.name} canceled the Debt Collector action.")
                return False

            else:
                print("Invalid choice. Please type 'play', 'bank', or 'cancel'.")

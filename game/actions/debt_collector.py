from game.actions.base_action import BaseAction
from game.card import ActionCard
from game.actions.just_say_no import JustSayNo

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
                if JustSayNo.attempt_block_with_just_say_no(self.player, target_player, 'Debt Collector'):
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

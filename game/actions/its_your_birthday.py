from game.actions.base_action import BaseAction
from game.card import ActionCard

class ItsYourBirthday(BaseAction):

    def attempt_block_with_just_say_no(self, initiator, target_player):
        """Allows players to counter each other's 'Just Say No' cards until one side runs out or chooses not to play."""
        while True:
            # Check if the target player has a "Just Say No" card
            jsn_card = next((card for card in target_player.hand if card.name == "Just Say No"), None)
            if jsn_card:
                print(f"\n{target_player.name} has a 'Just Say No' card!")
                choice = input(f"{target_player.name}, do you want to play 'Just Say No' to block the It's My Birthday? (y/n): ").strip().lower()
                if choice == 'y':
                    print(f"{target_player.name} plays 'Just Say No' to block the It's My Birthday.")
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
                            print(f"{initiator.name} chose not to counter. It's My Birthday is blocked.")
                            return True  # Final block
                    else:
                        print(f"{initiator.name} has no 'Just Say No' to counter. It's My Birthday is blocked.")
                        return True  # Blocked without counter
                else:
                    print(f"{target_player.name} chose not to block the It's My Birthday. It's My Birthday is not blocked.")
                    return False  # No block attempt
            else:
                print(f"{target_player.name} has no 'Just Say No' card. It's My Birthday is not blocked.")
                return False  # No 'Just Say No' to block

    def collect_birthday_money(self):
        """
        Collect birthday amount from every other player, allowing them to block with 'Just Say No'.
        """
        for player in self.game.players:
            if player != self.player:
                # Allow target player to block the action with 'Just Say No' before executing payment
                if self.attempt_block_with_just_say_no(self.player, player):
                    print(f"{player.name} blocked {self.player.name}'s 'It's My Birthday' card with 'Just Say No'.")
                    continue
                player.pay_to_player(2, self.player)

    def execute(self, card):
        while True:
            choice = input(f"{self.player.name}, do you want to play the 'It's My Birthday' card, put it in the bank, or cancel? (play/bank/cancel): ").strip().lower()

            if choice == 'play':
                print(f"{self.player.name} plays 'It's My Birthday'!")
                self.collect_birthday_money()
                self.game.discard_card(card)
                self.player.hand.remove(card)
                return True

            elif choice == 'bank':
                self.player.add_to_bank(card)
                print(f"{self.player.name} put 'It's My Birthday' card in the bank.")
                self.player.hand.remove(card)
                return True

            elif choice == 'cancel':
                print(f"{self.player.name} canceled the 'It's My Birthday' action.")
                return False

            else:
                print("Invalid choice. Please type 'play', 'bank', or 'cancel'.")

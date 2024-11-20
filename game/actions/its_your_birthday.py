from game.actions.base_action import BaseAction
from game.card import ActionCard
from game.actions.just_say_no import JustSayNo

class ItsYourBirthday(BaseAction):

    def collect_birthday_money(self):
        """
        Collect birthday amount from every other player, allowing them to block with 'Just Say No'.
        """
        for player in self.game.players:
            if player != self.player:
                # Allow target player to block the action with 'Just Say No' before executing payment
                if JustSayNo.attempt_block_with_just_say_no(self.player, player, "It's Your Birthday"):
                    print(f"{player.name} blocked {self.player.name}'s 'It's Your Birthday' card with 'Just Say No'.")
                    continue
                player.pay_to_player(2, self.player)

    def execute(self, card):
        while True:
            choice = input(f"{self.player.name}, do you want to play the 'It's Your Birthday' card, put it in the bank, or cancel? (play/bank/cancel): ").strip().lower()

            if choice == 'play':
                print(f"{self.player.name} plays 'It's Your Birthday'!")
                self.collect_birthday_money()
                self.game.discard_card(card)
                self.player.hand.remove(card)
                return True

            elif choice == 'bank':
                self.player.add_to_bank(card)
                print(f"{self.player.name} put 'It's Your Birthday' card in the bank.")
                self.player.hand.remove(card)
                return True

            elif choice == 'cancel':
                print(f"{self.player.name} canceled the 'It's Your Birthday' action.")
                return False

            else:
                print("Invalid choice. Please type 'play', 'bank', or 'cancel'.")

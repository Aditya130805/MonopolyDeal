from .base_action import BaseAction

class JustSayNo(BaseAction):

    def attempt_block_with_just_say_no(initiator, target_player, action_name):
        """Allows players to counter each other's 'Just Say No' cards until one side runs out or chooses not to play."""
        while True:
            # Check if the target player has a "Just Say No" card
            jsn_card = next((card for card in target_player.hand if card.name == "Just Say No"), None)
            if jsn_card:
                print(f"\n{target_player.name} has a 'Just Say No' card!")
                choice = input(f"{target_player.name}, do you want to play 'Just Say No' to block the {action_name}? (y/n): ").strip().lower()
                if choice == 'y':
                    print(f"{target_player.name} plays 'Just Say No' to block the {action_name}.")
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
                            print(f"{initiator.name} chose not to counter. {action_name} is blocked.")
                            return True  # Final block
                    else:
                        print(f"{initiator.name} has no 'Just Say No' to counter. {action_name} is blocked.")
                        return True  # Blocked without counter
                else:
                    print(f"{target_player.name} chose not to block the {action_name}. {action_name} is not blocked.")
                    return False  # No block attempt
            else:
                print(f"{target_player.name} has no 'Just Say No' card. {action_name} is not blocked.")
                return False  # No 'Just Say No' to block
    
    def execute(self, card):
        while True:
            # Ask the player for their choice
            choice = input(f"{self.player.name}, do you want to put the 'Just Say No' card in the bank or cancel it? (bank/cancel): ").strip().lower()

            if choice == "bank":
                # If the player chooses to bank the card
                self.player.add_to_bank(card)
                print(f"{self.player.name} put Just Say No in the bank.")
                self.player.hand.remove(card)
                return True  # Return True as the card was put in the bank

            elif choice == "cancel":
                # If the player chooses to cancel
                print(f"{self.player.name} canceled the Just Say No action.")
                return False  # Return False as the action was canceled

            else:
                # If the input is invalid, prompt again
                print("Invalid choice. Please type 'bank' or 'cancel'.")

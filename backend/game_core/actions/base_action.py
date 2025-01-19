class BaseAction:
    def __init__(self, player, game):
        self.player = player
        self.game = game

    def execute(self, card):
        """Execute the action. Override this in subclasses."""
        raise NotImplementedError("Subclasses should implement this method.")

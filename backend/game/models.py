from django.db import models

# Create your models here.

class GameRoom(models.Model):
    room_id = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    player_count = models.IntegerField(default=0)
    max_players = models.IntegerField(default=4)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"Game Room {self.room_id} ({self.player_count}/{self.max_players} players)"

    class Meta:
        db_table = 'game_room'

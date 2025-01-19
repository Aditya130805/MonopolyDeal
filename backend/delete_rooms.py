import os
import django

# Set up the Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.backend.settings')
django.setup()

from backend.game.models import GameRoom

def delete_all_rooms():
    try:
        count, _ = GameRoom.objects.all().delete()  # Delete all rooms
        print(f'Successfully deleted {count} rooms.')
    except Exception as e:
        print(f'Error deleting rooms: {str(e)}')

if __name__ == '__main__':
    delete_all_rooms()
    
    
# Check: curl -X GET http://localhost:8000/api/rooms


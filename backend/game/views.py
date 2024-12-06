from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import json
import random
import string
import logging
from .models import GameRoom

logger = logging.getLogger(__name__)

def generate_room_code():
    """
    Generate a 6-character room code.
    Using both letters and numbers gives us 36^6 = 2,176,782,336 possible combinations
    (26 letters + 10 digits = 36 possible characters)
    """
    characters = string.ascii_uppercase + string.digits  # 26 letters + 10 digits = 36 characters
    return ''.join(random.choices(characters, k=6))

# Create your views here.

@csrf_exempt
@require_http_methods(["POST"])
def create_room(request):
    logger.info("Attempting to create a new room")
    max_attempts = 10  # Prevent infinite loop in the extremely unlikely case of collisions
    attempts = 0
    
    try:
        # Generate a unique room code
        while attempts < max_attempts:
            room_id = generate_room_code()
            if not GameRoom.objects.filter(room_id=room_id).exists():
                break
            attempts += 1
        
        if attempts == max_attempts:
            raise Exception("Failed to generate unique room code")
            
        logger.info(f"Generated room ID: {room_id}")
        # Initialize room with 1 player (the creator)
        room = GameRoom.objects.create(room_id=room_id, player_count=1)
        logger.info(f"Successfully created room with ID: {room_id}")
        
        response_data = {
            'status': 'success',
            'room_id': room.room_id,
            'player_count': room.player_count,
            'max_players': room.max_players
        }
        logger.info(f"Returning response: {response_data}")
        return JsonResponse(response_data)
    except Exception as e:
        logger.error(f"Error creating room: {str(e)}", exc_info=True)
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        }, status=400)

@csrf_exempt
@require_http_methods(["GET"])
def get_room(request, room_id):

    logger.info(f"Attempting to get room with ID: {room_id}")
    try:
        room = GameRoom.objects.get(room_id=room_id)
        logger.info(f"Found room: {room_id}")
        
        response_data = {
            'status': 'success',
            'room_id': room.room_id,
            'player_count': room.player_count,
            'max_players': room.max_players,
            'is_active': room.is_active
        }

        if room.player_count >= room.max_players:
            logger.warning(f"Room is full: {room_id}")
            return JsonResponse({
                'status': 'error',
                'message': 'Room is full'
            }, status=400)

        logger.info(f"Returning response: {response_data}")
        return JsonResponse(response_data)
    except GameRoom.DoesNotExist:
        logger.warning(f"Room not found: {room_id}")
        return JsonResponse({
            'status': 'error',
            'message': 'Room not found'
        }, status=404)
    except Exception as e:
        logger.error(f"Error getting room: {str(e)}", exc_info=True)
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        }, status=400)
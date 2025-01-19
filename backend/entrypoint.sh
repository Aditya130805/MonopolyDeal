#!/bin/sh
PORT="${PORT:-8000}"
exec daphne -b 0.0.0.0 -p $PORT backend.asgi:application

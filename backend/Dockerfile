FROM python:3.11-slim

WORKDIR /app

# Copy the backend directory to /app/backend
COPY . /app/backend/

# Install dependencies
RUN pip install -r /app/backend/requirements.txt

# Set environment variables
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1
ENV PORT=8000

# Set the working directory to /app
WORKDIR /app

# Create a script to run migrations and start the server
RUN echo '#!/bin/bash\ncd /app/backend\npython manage.py migrate\ndaphne -b 0.0.0.0 -p 8000 backend.backend.asgi:application' > /app/start.sh
RUN chmod +x /app/start.sh

# Command to run migrations and start the server
CMD ["/app/start.sh"]

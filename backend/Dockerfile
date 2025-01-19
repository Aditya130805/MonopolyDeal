FROM python:3.11-slim

WORKDIR /app

# Copy the backend directory to /app/backend
COPY . /app/backend/

# Install dependencies
RUN pip install -r /app/backend/requirements.txt

# Set environment variables
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1

# Set the working directory to /app
WORKDIR /app

# Command to run the application
CMD ["daphne", "-b", "0.0.0.0", "-p", "$PORT", "backend.asgi:application"]

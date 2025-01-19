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

# Make entrypoint script executable
RUN chmod +x /app/backend/entrypoint.sh

# Set the working directory to /app
WORKDIR /app

# Use entrypoint script
ENTRYPOINT ["/app/backend/entrypoint.sh"]

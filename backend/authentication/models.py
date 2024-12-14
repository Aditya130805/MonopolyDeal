from django.contrib.auth.models import AbstractUser
from django.db import models
import uuid

# Create your models here.

class User(AbstractUser):
    email = models.EmailField(unique=True)
    username = models.CharField(max_length=150, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    unique_id = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)

    USERNAME_FIELD = 'email'  # Primary identifier for authentication
    REQUIRED_FIELDS = ['username']  # Other required fields apart from the primary identifier

    def __str__(self):
        return self.email

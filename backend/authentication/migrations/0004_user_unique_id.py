# Generated by Django 5.1.3 on 2024-12-10 18:49

import uuid
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('authentication', '0003_user_unique_id'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='unique_id',
            field=models.UUIDField(default=uuid.uuid4, editable=False, unique=True),
        ),
    ]

from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    display_name = models.CharField(max_length=50, blank=True)
    avatar_url = models.URLField(blank=True)

    def __str__(self):
        return self.display_name or self.username

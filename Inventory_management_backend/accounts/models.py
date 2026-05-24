from base.models.mixins import BaseModel
from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser , BaseModel):
    name = models.CharField(max_length=255)
    date_of_birth = models.DateField(null=True)
    address = models.TextField()
    state = models.CharField(max_length=100)
    city = models.CharField(max_length=100)

    ROLE_CHOICES = (
        ('ADMIN', 'Admin'),
        ('MANAGER', 'Manager'),
        ('STAFF', 'Staff'),
        ('BUYER', 'Buyer'),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='BUYER')
    
    def __str__(self):
        return self.username

from django.db import models
from base.models.mixins import BaseModel
from django.core.validators import MinValueValidator

class Warehouse(BaseModel):
    name = models.CharField(max_length=255)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    capacity = models.PositiveIntegerField(
        validators=[MinValueValidator(0)]
    )
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.name} - {self.city}"

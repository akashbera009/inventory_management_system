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
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.name} - {self.city}"

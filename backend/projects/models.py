from django.db import models


class ProductionStatus(models.TextChoices):
    ON_DECK = 'ON_DECK', 'On Deck'
    IN_PROGRESS = 'IN_PROGRESS', 'In Progress'
    READY_FOR_FINISHING = 'READY_FOR_FINISHING', 'Ready for Finishing'
    READY_FOR_INSTALL = 'READY_FOR_INSTALL', 'Ready for Install'
    COMPLETE = 'COMPLETE', 'Complete'


class Project(models.Model):
    customer = models.CharField(max_length=255)
    name = models.CharField(max_length=255)
    # Not assumed globally unique
    project_number = models.CharField(max_length=50)
    # Projects are activated/deactivated, never deleted, through the normal API;
    # inactive projects must stay available for historical time entries.
    active = models.BooleanField(default=True)
    production_status = models.CharField(
        max_length=30, choices=ProductionStatus.choices, default=ProductionStatus.ON_DECK
    )

    def __str__(self):
        return f'{self.project_number} - {self.name}'

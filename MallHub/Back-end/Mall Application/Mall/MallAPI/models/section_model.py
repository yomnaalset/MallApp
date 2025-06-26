from django.db import models
from django.utils import timezone
from django.core.exceptions import ValidationError
from MallAPI.utils import format_error_message

class Section(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    is_default = models.BooleanField(default=False)

    class Meta:
        ordering = ['name']

    def save(self, *args, **kwargs):
        if self.is_default:
            # Set all other sections' is_default to False
            Section.objects.filter(is_default=True).update(is_default=False)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

    @classmethod
    def get_default_section(cls):
        default_section = cls.objects.filter(is_default=True).first()
        if not default_section:
            default_section = cls.objects.create(
                name="General",
                description="Default section for stores",
                is_default=True
            )
        return default_section.id

    def clean(self):
        try:
            # Check for duplicate names (case-insensitive)
            if Section.objects.filter(name__iexact=self.name).exclude(pk=self.pk).exists():
                raise ValidationError(format_error_message("A section with this name already exists."))
            
            # Move the unique validation to the clean method
            if Section.objects.filter(
                name__iexact=self.name,
                description=self.description
            ).exclude(pk=self.pk).exists():
                raise ValidationError(format_error_message("A section with this name and description already exists."))
        except ValidationError as e:
            raise ValidationError(format_error_message(str(e))) 
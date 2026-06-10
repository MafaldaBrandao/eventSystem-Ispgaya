from django.contrib import admin
from .models import CulturalContent


@admin.register(CulturalContent)
class CulturalContentAdmin(admin.ModelAdmin):
    list_display = ('title', 'area', 'status', 'date', 'updated_at')
    list_filter = ('area', 'status')
    search_fields = ('title', 'description')

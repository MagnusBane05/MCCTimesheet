from django.contrib import admin

from materials.models import MaterialEntry, MaterialType, MaterialTypeCategory


@admin.register(MaterialEntry)
class MaterialEntryAdmin(admin.ModelAdmin):
    list_display = ('name', 'project', 'material_type', 'employee')
    list_filter = ('project', 'material_type__category')
    search_fields = ('name', 'description', 'employee__username')

@admin.register(MaterialType)
class MaterialTypeAdmin(admin.ModelAdmin):
    list_display = ('name', 'category')
    list_filter = ('category',)
    search_fields = ('name', 'category__name')
    list_select_related = ('category',)

@admin.register(MaterialTypeCategory)
class MaterialTypeCategoryAdmin(admin.ModelAdmin):
    list_display = ('name',)
    search_fields = ('name',)

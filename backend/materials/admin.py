from django.contrib import admin

from materials.models import MaterialEntry, MaterialType, MaterialTypeCategory


@admin.register(MaterialEntry)
class MaterialEntryAdmin(admin.ModelAdmin):
    list_display = ('material_type', 'project', 'quantity', 'employee')
    list_filter = ('project', 'material_type__category')
    search_fields = ('material_type__name', 'description', 'employee__username')

@admin.register(MaterialType)
class MaterialTypeAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'active')
    list_filter = ('category', 'active')
    search_fields = ('name', 'category__name')
    list_select_related = ('category',)

@admin.register(MaterialTypeCategory)
class MaterialTypeCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'active')
    list_filter = ('active',)
    search_fields = ('name',)

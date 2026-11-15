import django.core.validators
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('materials', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='materialentry',
            name='quantity',
            field=models.PositiveIntegerField(default=1, validators=[django.core.validators.MinValueValidator(1)]),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='materialtype',
            name='active',
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name='materialtypecategory',
            name='active',
            field=models.BooleanField(default=True),
        ),
        migrations.AlterModelOptions(
            name='materialentry',
            options={'ordering': ['material_type', 'created_at']},
        ),
        migrations.RemoveField(
            model_name='materialentry',
            name='name',
        ),
    ]

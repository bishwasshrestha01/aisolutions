# Manual migration: rename JobApplication fields to match form labels

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0013_remove_jobapplication_experience'),
    ]

    operations = [
        migrations.RenameField(
            model_name='jobapplication',
            old_name='position',
            new_name='job',
        ),
        migrations.RenameField(
            model_name='jobapplication',
            old_name='cover_letter',
            new_name='why_join',
        ),
        migrations.RenameField(
            model_name='jobapplication',
            old_name='resume',
            new_name='cv',
        ),
    ]

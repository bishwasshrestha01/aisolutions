from django.contrib import admin
from .models import Event, EventRegistration, Inquiry, DemoRequest

admin.site.register(Event)
admin.site.register(EventRegistration)
admin.site.register(Inquiry)
admin.site.register(DemoRequest)

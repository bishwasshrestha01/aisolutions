from django.db import models


class Event(models.Model):
    id = models.CharField(max_length=255, primary_key=True)
    title = models.CharField(max_length=255)
    type = models.CharField(max_length=100)
    date = models.CharField(max_length=50)
    time = models.CharField(max_length=50)
    location = models.CharField(max_length=255)
    speaker = models.CharField(max_length=255, blank=True, default='')
    description = models.TextField()
    capacity = models.IntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'events'
        ordering = ['-date']

    def __str__(self):
        return self.title


class EventRegistration(models.Model):
    id = models.CharField(max_length=255, primary_key=True)
    event_id = models.CharField(max_length=255)
    event_title = models.CharField(max_length=255, blank=True, default='')
    attendee_name = models.CharField(max_length=255)
    attendee_email = models.EmailField()
    attendee_phone = models.CharField(max_length=30, blank=True)
    status = models.CharField(max_length=20, default='pending')
    user = models.ForeignKey('core.User', on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'event_registrations'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.attendee_name} - {self.event_id}"


class Inquiry(models.Model):
    id = models.CharField(max_length=255, primary_key=True)
    name = models.CharField(max_length=255)
    email = models.EmailField()
    message = models.TextField()
    status = models.CharField(max_length=20, default='new')
    user = models.ForeignKey('core.User', on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)

    class Meta:
        db_table = 'inquiries'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} - {self.email}"


class User(models.Model):
    name = models.CharField(max_length=255)
    email = models.EmailField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'users'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} - {self.email}"


class PageVisit(models.Model):
    date = models.DateField(unique=True)
    visits = models.IntegerField(default=0)

    class Meta:
        db_table = 'page_visits'
        ordering = ['-date']

    def __str__(self):
        return f"{self.date}: {self.visits} visits"


class DemoRequest(models.Model):
    id = models.CharField(max_length=255, primary_key=True)
    name = models.CharField(max_length=255)
    email = models.EmailField()
    phone = models.CharField(max_length=30, blank=True)
    preferred_date = models.CharField(max_length=50, blank=True)
    service = models.CharField(max_length=255, blank=True)
    message = models.TextField(blank=True, default='')
    country = models.CharField(max_length=255, blank=True, default='')
    status = models.CharField(max_length=20, default='pending')
    user = models.ForeignKey('core.User', on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'demo_requests'
        ordering = ['-created_at']

    def __str__(self):
        return f"Demo - {self.name}"


class Feedback(models.Model):
    id = models.CharField(max_length=255, primary_key=True)
    name = models.CharField(max_length=255)
    email = models.EmailField()
    service_used = models.CharField(max_length=50, blank=True, default='')
    satisfaction_rating = models.IntegerField(null=True, blank=True)
    recommendation = models.CharField(max_length=10, blank=True, default='')
    user = models.ForeignKey('core.User', on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)

    class Meta:
        db_table = 'feedback'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} - {self.email}"

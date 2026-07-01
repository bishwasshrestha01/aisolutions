from rest_framework import serializers
from .models import Event, EventRegistration, Inquiry, User, DemoRequest, Feedback


class EventSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = ['id', 'title', 'type', 'date', 'time', 'location', 'speaker', 'description', 'capacity', 'created_at']


class EventRegistrationSerializer(serializers.ModelSerializer):
    class Meta:
        model = EventRegistration
        fields = ['id', 'event_id', 'event_title', 'attendee_name', 'attendee_email', 'attendee_phone', 'status', 'user', 'created_at']


class InquirySerializer(serializers.ModelSerializer):
    class Meta:
        model = Inquiry
        fields = ['id', 'name', 'email', 'message', 'status', 'user', 'created_at']


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'name', 'email', 'created_at']


class DemoRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = DemoRequest
        fields = ['id', 'name', 'email', 'phone', 'preferred_date', 'service', 'message', 'country', 'status', 'user', 'created_at']


class FeedbackSerializer(serializers.ModelSerializer):
    class Meta:
        model = Feedback
        fields = ['id', 'name', 'email', 'service_used', 'satisfaction_rating', 'recommendation', 'user', 'created_at']

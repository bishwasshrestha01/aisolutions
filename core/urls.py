"""URL configuration for core API routes."""
from django.urls import path
from . import views

urlpatterns = [
    # Health & Info
    path('health/', views.health_check, name='health_check'),
    path('info/', views.api_info, name='api_info'),

    # Events (Django format)
    path('events/', views.events_list, name='events_list'),
    path('events/create/', views.event_create, name='event_create'),
    path('events/<str:event_id>/', views.event_detail, name='event_detail'),
    path('events/<str:event_id>/update/', views.event_update, name='event_update'),
    path('events/<str:event_id>/delete/', views.event_delete, name='event_delete'),

    # Events (Node.js compatibility)
    path('events', views.events_compat, name='events_compat'),
    path('events/<str:event_id>', views.event_detail_compat, name='event_detail_compat'),

    # Event Registrations
    path('events/<str:event_id>/register/', views.register_for_event, name='register_for_event'),
    path('events/<str:event_id>/registrations/', views.registrations_for_event, name='registrations_for_event'),
    path('registrations', views.registrations_compat, name='registrations_compat'),
    path('registrations/', views.registrations_compat, name='registrations_compat_slash'),
    path('registrations/<str:reg_id>', views.registration_detail, name='registration_detail'),

    # Inquiries
    path('inquiries/', views.inquiries_list, name='inquiries_list'),
    path('inquiries/create/', views.create_inquiry, name='create_inquiry'),
    path('inquiries', views.inquiries_compat, name='inquiries_compat'),
    path('inquiries/<str:inquiry_id>', views.inquiry_detail_compat, name='inquiry_detail_compat'),

    # Demo Requests
    path('demo-requests/', views.demo_requests_list, name='demo_requests_list'),
    path('demo-requests/create/', views.request_demo, name='request_demo'),
    path('demo-requests', views.demo_requests_compat, name='demo_requests_compat'),
    path('demo-requests/<str:demo_id>', views.demo_delete, name='demo_delete'),
    path('demos', views.demos_list_raw, name='demos_list_raw'),
    path('demos/<str:demo_id>', views.demo_update, name='demo_update'),

    # Users
    path('users/', views.users_list, name='users_list'),

    # Visits
    path('visits/', views.visits_list, name='visits_list'),
    path('visits', views.visits_list, name='visits_list_noslash'),

    # Chat
    path('chat/', views.chat, name='chat'),

    # Feedback
    path('feedback/', views.feedback_list, name='feedback_list'),
    path('feedback/create/', views.create_feedback, name='create_feedback'),
    path('feedback', views.feedback_compat, name='feedback_compat'),
    path('feedback/<str:feedback_id>', views.feedback_detail_compat, name='feedback_detail_compat'),

    # Auth
    path('auth/login/', views.admin_login, name='admin_login'),
    path('auth/logout/', views.admin_logout, name='admin_logout'),
    path('auth/me/', views.admin_me, name='admin_me'),
    path('auth/change-password/', views.admin_change_password, name='admin_change_password'),
]

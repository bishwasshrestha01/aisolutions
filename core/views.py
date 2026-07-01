"""Core API views for AI Solutions."""
import json
import uuid
from datetime import datetime
from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
import requests

from .models import Event, EventRegistration, Inquiry, User, DemoRequest, Feedback
from .serializers import EventSerializer, EventRegistrationSerializer, InquirySerializer, DemoRequestSerializer, FeedbackSerializer
from chatbot.knowledge import (
    PRICING_RESPONSE,
    get_system_prompt,
    is_pricing_question,
    sanitize_response,
    enforce_max_length,
)


def save_or_update_user(name, email):
    if not name or not email:
        return None
    user, _ = User.objects.update_or_create(email=email, defaults={'name': name})
    return user


# ============ EVENT ENDPOINTS ============

@api_view(['GET'])
def events_list(request):
    """Get all events with available seat counts"""
    try:
        events = Event.objects.all()
        from django.db.models import Count, Q
        approved_counts = EventRegistration.objects.filter(status='approved').values('event_id').annotate(count=Count('id'))
        approved_map = {item['event_id']: item['count'] for item in approved_counts}

        data = EventSerializer(events, many=True).data
        for item in data:
            capacity = item.get('capacity') or 0
            approved_count = approved_map.get(item['id'], 0)
            available = max(0, capacity - approved_count)
            item['total_seats'] = capacity
            item['available_seats'] = available

        return Response({
            'success': True,
            'data': data,
            'count': len(data)
        })
    except Exception as e:
        return Response({'success': False, 'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def event_create(request):
    """Create new event"""
    try:
        data = request.data

        if not data.get('title') or not data.get('date'):
            return Response(
                {'success': False, 'error': 'title and date are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        event_id = f"{data['title'].lower().replace(' ', '-')}-{int(datetime.now().timestamp())}"

        event = Event.objects.create(
            id=event_id,
            title=data.get('title'),
            type=data.get('type') or '',
            date=data.get('date'),
            time=data.get('time') or '',
            location=data.get('location') or '',
            speaker=data.get('speaker') or '',
            description=data.get('description') or '',
            capacity=data.get('capacity') or 0
        )

        serializer = EventSerializer(event)
        return Response({'success': True, 'data': serializer.data}, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({'success': False, 'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def event_detail(request, event_id):
    """Get event details with available seat counts"""
    try:
        event = Event.objects.get(id=event_id)
        data = EventSerializer(event).data
        capacity = data.get('capacity') or 0
        approved_count = EventRegistration.objects.filter(event_id=event_id, status='approved').count()
        data['total_seats'] = capacity
        data['available_seats'] = max(0, capacity - approved_count)
        return Response({'success': True, 'data': data})
    except Event.DoesNotExist:
        return Response({'success': False, 'error': 'Event not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'success': False, 'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PUT'])
def event_update(request, event_id):
    """Update event"""
    try:
        event = Event.objects.get(id=event_id)
        data = request.data

        event.title = data.get('title', event.title)
        event.type = data.get('type') if data.get('type') is not None else event.type
        event.date = data.get('date', event.date)
        event.time = data.get('time') if data.get('time') is not None else event.time
        event.location = data.get('location') if data.get('location') is not None else event.location
        event.speaker = data.get('speaker') if data.get('speaker') is not None else event.speaker
        event.description = data.get('description') if data.get('description') is not None else event.description
        event.capacity = data.get('capacity') if data.get('capacity') is not None else event.capacity
        event.save()

        serializer = EventSerializer(event)
        return Response({'success': True, 'data': serializer.data})
    except Event.DoesNotExist:
        return Response({'success': False, 'error': 'Event not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'success': False, 'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['DELETE'])
def event_delete(request, event_id):
    """Delete event"""
    try:
        event = Event.objects.get(id=event_id)
        event.delete()
        return Response({'success': True, 'message': 'Event deleted'})
    except Event.DoesNotExist:
        return Response({'success': False, 'error': 'Event not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'success': False, 'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ============ EVENT REGISTRATION ENDPOINTS ============

@api_view(['POST'])
def register_for_event(request, event_id):
    """Register for event"""
    try:
        data = request.data

        attendee_name = data.get('attendee_name') or data.get('full_name')
        attendee_email = data.get('attendee_email') or data.get('user_email')
        resolved_event_id = data.get('event_id') or event_id

        if not resolved_event_id or not attendee_name or not attendee_email:
            return Response(
                {'success': False, 'error': 'event_id, attendee_name, and attendee_email are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        reg_id = f"reg-{uuid.uuid4().hex[:12]}"

        event_title = ''
        if resolved_event_id:
            try:
                event_obj = Event.objects.get(id=resolved_event_id)
                event_title = event_obj.title
            except Event.DoesNotExist:
                event_title = data.get('event_title', '')

        registration = EventRegistration.objects.create(
            id=reg_id,
            event_id=resolved_event_id,
            event_title=event_title,
            attendee_name=attendee_name,
            attendee_email=attendee_email,
            attendee_phone=data.get('attendee_phone') or data.get('phone', '')
        )

        user = save_or_update_user(attendee_name, attendee_email)
        if user:
            registration.user = user
            registration.save(update_fields=['user'])

        serializer = EventRegistrationSerializer(registration)
        return Response({'success': True, 'data': serializer.data}, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({'success': False, 'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def registrations_for_event(request, event_id):
    """Get all registrations for an event"""
    try:
        registrations = EventRegistration.objects.filter(event_id=event_id)
        serializer = EventRegistrationSerializer(registrations, many=True)
        return Response({'success': True, 'data': serializer.data, 'count': registrations.count()})
    except Exception as e:
        return Response({'success': False, 'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ============ INQUIRY ENDPOINTS ============

@api_view(['POST'])
def create_inquiry(request):
    """Create contact inquiry"""
    try:
        data = request.data

        if not data.get('name') or not data.get('email') or not data.get('message'):
            return Response(
                {'success': False, 'error': 'name, email, and message are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        inquiry_id = f"inq-{uuid.uuid4().hex[:12]}"

        inquiry = Inquiry.objects.create(
            id=inquiry_id,
            name=data.get('name'),
            email=data.get('email'),
            message=data.get('message')
        )

        user = save_or_update_user(data.get('name'), data.get('email'))
        if user:
            inquiry.user = user
            inquiry.save(update_fields=['user'])

        serializer = InquirySerializer(inquiry)
        return Response({'success': True, 'data': serializer.data}, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({'success': False, 'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def inquiries_list(request):
    """Get all inquiries"""
    try:
        inquiries = Inquiry.objects.all()
        serializer = InquirySerializer(inquiries, many=True)
        return Response({'success': True, 'data': serializer.data, 'count': inquiries.count()})
    except Exception as e:
        return Response({'success': False, 'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ============ DEMO REQUEST ENDPOINTS ============

@api_view(['POST'])
def request_demo(request):
    """Request a demo"""
    try:
        data = request.data

        name = data.get('name') or data.get('full_name')
        email = data.get('email')

        if not name or not email:
            return Response(
                {'success': False, 'error': 'name and email are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        demo_id = f"demo-{uuid.uuid4().hex[:12]}"

        demo = DemoRequest.objects.create(
            id=demo_id,
            name=name,
            email=email,
            phone=data.get('phone', ''),
            preferred_date=data.get('preferred_date', ''),
            service=data.get('service') or data.get('interested_service', ''),
            country=data.get('country', '')
        )

        user = save_or_update_user(name, email)
        if user:
            demo.user = user
            demo.save(update_fields=['user'])

        serializer = DemoRequestSerializer(demo)
        return Response({'success': True, 'data': serializer.data}, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({'success': False, 'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def demo_requests_list(request):
    """Get all demo requests"""
    try:
        demos = DemoRequest.objects.all()
        serializer = DemoRequestSerializer(demos, many=True)
        return Response({'success': True, 'data': serializer.data, 'count': demos.count()})
    except Exception as e:
        return Response({'success': False, 'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ============ AI CHATBOT ENDPOINTS ============

FALLBACK_RESPONSES = {
    'integrate': 'Absolutely. Our AI solutions integrate with your stack via REST APIs, webhooks, and SDKs for Python, Node.js, AWS, or Azure.',
    'chatbot': 'Definitely. We build AI chatbots you can embed on your website, app, WhatsApp, Messenger, or CRM.',
    'assistant': 'Our AI Virtual Assistant is always on. It handles support, lead qualification, order tracking, and FAQs around the clock.',
    'service': 'We offer AI Virtual Assistants, Chatbots, Business Automation, Software Prototyping, and Custom AI Solutions.',
    'api': 'All our solutions include REST API access. We support Python, Node.js, AWS, Azure, and custom integrations.',
    'custom': 'Our Custom AI Solutions include predictive analytics, dashboards, document processing, and enterprise automation.',
    'prototyp': 'We build rapid prototypes and MVPs to validate your AI ideas before committing to full development.',
    'automate': 'Our automation tools handle data entry, approvals, reporting, and invoices so your team saves hours weekly.',
    'automation': 'Our automation tools handle data entry, approvals, reporting, and invoices so your team saves hours weekly.',
    'pricing': 'Pricing is tailored to each project. The best way to get a quote is to schedule a free demo with our team.',
    'demo': 'You can book a free demo through our website. We will show you exactly how our AI fits your business.',
    'contact': 'You can call us at +44 191 555 0140 or email support@aisolutions.com. We are happy to help.',
    'event': 'We run webinars and hands-on workshops on AI throughout the year. Check our events page for upcoming dates.',
    'training': 'Yes, we offer training on our AI solutions. Contact us and we will set up a session tailored to you.',
    'default': 'Hi there. I am the AI Solutions assistant. I can help with our services, demos, pricing, events, and more.'
}


@api_view(['POST'])
def chat(request):
    """AI Chat endpoint using OpenRouter API"""
    try:
        data = request.data
        user_message = data.get('message', '').strip()
        conversation_id = data.get('conversation_id', 'default')

        if not user_message:
            return Response({'success': False, 'error': 'Message is required'}, status=status.HTTP_400_BAD_REQUEST)

        if is_pricing_question(user_message):
            safe_pricing = sanitize_response(PRICING_RESPONSE)
            return Response({'success': True, 'response': safe_pricing, 'source': 'knowledge_base'})

        # Check for event-related queries and use live data
        event_keywords = ['event', 'webinar', 'workshop', 'upcoming', 'schedule', 'summit']
        is_event_query = any(kw in user_message.lower() for kw in event_keywords)
        if is_event_query:
            try:
                today = datetime.now().date().isoformat()
                all_events = Event.objects.all().order_by('date')
                future_events = [e for e in all_events if e.date >= today][:5]

                # Check for a specific event mention
                msg_lower = user_message.lower()
                matched = None
                for e in all_events:
                    title_words = e.title.lower().split()
                    if any(w in msg_lower for w in title_words if len(w) > 3):
                        matched = e
                        break

                if matched:
                    parts = [f'{matched.title} — {matched.date}']
                    if matched.time: parts.append(matched.time)
                    if matched.location: parts.append(matched.location)
                    if matched.speaker: parts.append(f'Speaker: {matched.speaker}')
                    parts.append('Register on our events page.')
                    response_text = sanitize_response(' | '.join(parts))
                    if len(response_text) > 200:
                        response_text = sanitize_response(f'{matched.title} on {matched.date}. Visit our events page to register.')
                elif future_events:
                    raw_text = 'Here are our upcoming events:\n'
                    raw_text += '\n'.join([f'{e.date} — {e.title}' for e in future_events])
                    raw_text += '\nVisit our events page to register.'
                    if len(raw_text) > 200:
                        response_text = sanitize_response('We have upcoming events including ' + ', '.join([e.title for e in future_events[:3]]) + '. Check the events page for full details.')
                    else:
                        response_text = sanitize_response(raw_text)
                else:
                    response_text = sanitize_response('We do not have any upcoming events scheduled right now. Check back soon or contact us for future dates.')
                return Response({'success': True, 'response': response_text, 'source': 'events'})
            except Exception:
                pass

        # Try to use OpenRouter AI first
        api_key = settings.OPENROUTER_API_KEY
        if api_key and api_key != 'sk-or-v1-default':
            try:
                response = _call_openrouter_api(user_message, api_key)
                if response:
                    response = sanitize_response(response)
                    return Response({'success': True, 'response': response, 'source': 'ai'})
            except Exception as e:
                print(f"OpenRouter API error: {str(e)}")
                pass

        # Fallback to keyword-based responses
        fallback_response = sanitize_response(_get_fallback_response(user_message))

        return Response({'success': True, 'response': fallback_response, 'source': 'fallback'})

    except Exception as e:
        return Response({'success': False, 'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def _call_openrouter_api(message, api_key):
    """Call OpenRouter API for AI response"""
    try:
        url = f"{settings.OPENROUTER_BASE_URL}/chat/completions"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "HTTP-Referer": "http://localhost:8000",
            "Content-Type": "application/json"
        }

        payload = {
            "model": settings.OPENROUTER_MODEL,
            "messages": [
                {
                    "role": "system",
                    "content": get_system_prompt()
                },
                {
                    "role": "user",
                    "content": message
                }
            ],
            "temperature": 0.5,
            "max_tokens": 300
        }

        response = requests.post(url, json=payload, headers=headers, timeout=10)

        if response.status_code == 200:
            result = response.json()
            content = result['choices'][0]['message']['content']
            return sanitize_response(content)
        else:
            return None
    except Exception as e:
        print(f"Error calling OpenRouter: {str(e)}")
        return None


def _get_fallback_response(message):
    """Get keyword-based fallback response"""
    message_lower = message.lower()

    for keyword, response in FALLBACK_RESPONSES.items():
        if keyword != 'default' and keyword in message_lower:
            return response

    return FALLBACK_RESPONSES['default']



# ============ NODE-STYLE API COMPATIBILITY ============

@api_view(['GET'])
def events_list_raw(request):
    """Return events as a raw array (Node.js API compatibility)."""
    events = Event.objects.all()
    from django.db.models import Count
    approved_counts = EventRegistration.objects.filter(status='approved').values('event_id').annotate(count=Count('id'))
    approved_map = {item['event_id']: item['count'] for item in approved_counts}
    data = EventSerializer(events, many=True).data
    for item in data:
        capacity = item.get('capacity') or 0
        item['total_seats'] = capacity
        item['available_seats'] = max(0, capacity - approved_map.get(item['id'], 0))
    return Response(data)


@api_view(['GET', 'POST'])
def events_compat(request):
    """Node.js-compatible events endpoint."""
    if request.method == 'GET':
        events = Event.objects.all()
        from django.db.models import Count
        approved_counts = EventRegistration.objects.filter(status='approved').values('event_id').annotate(count=Count('id'))
        approved_map = {item['event_id']: item['count'] for item in approved_counts}
        data = EventSerializer(events, many=True).data
        for item in data:
            capacity = item.get('capacity') or 0
            item['total_seats'] = capacity
            item['available_seats'] = max(0, capacity - approved_map.get(item['id'], 0))
        return Response(data)
    try:
        data = request.data
        if not data.get('title') or not data.get('date'):
            return Response(
                {'success': False, 'error': 'title and date are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        event_id = data.get('id') or f"{data['title'].lower().replace(' ', '-')}-{int(datetime.now().timestamp())}"
        event = Event.objects.create(
            id=event_id,
            title=data.get('title'),
            type=data.get('type') or '',
            date=data.get('date'),
            time=data.get('time') or '',
            location=data.get('location') or '',
            speaker=data.get('speaker') or '',
            description=data.get('description') or '',
            capacity=data.get('capacity') or 0
        )
        return Response({'success': True, 'id': event_id, 'data': EventSerializer(event).data},
                        status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({'success': False, 'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PUT', 'DELETE'])
def event_detail_compat(request, event_id):
    """Update or delete an event using Node.js paths."""
    try:
        event = Event.objects.get(id=event_id)
    except Event.DoesNotExist:
        return Response({'success': False, 'error': 'Event not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'DELETE':
        event.delete()
        return Response({'success': True})

    data = request.data
    event.title = data.get('title', event.title)
    event.type = data.get('type') if data.get('type') is not None else event.type
    event.date = data.get('date', event.date)
    event.time = data.get('time') if data.get('time') is not None else event.time
    event.location = data.get('location') if data.get('location') is not None else event.location
    event.speaker = data.get('speaker') if data.get('speaker') is not None else event.speaker
    event.description = data.get('description') if data.get('description') is not None else event.description
    event.capacity = data.get('capacity') if data.get('capacity') is not None else event.capacity
    event.save()
    result = EventSerializer(event).data
    capacity = result.get('capacity') or 0
    approved_count = EventRegistration.objects.filter(event_id=event_id, status='approved').count()
    result['total_seats'] = capacity
    result['available_seats'] = max(0, capacity - approved_count)
    return Response({'success': True, 'id': event_id, 'data': result})


@api_view(['GET', 'POST'])
def inquiries_compat(request):
    """Node.js-compatible inquiries endpoint."""
    if request.method == 'GET':
        inquiries = Inquiry.objects.all()
        return Response(InquirySerializer(inquiries, many=True).data)
    try:
        data = request.data
        if not data.get('name') or not data.get('email') or not data.get('message'):
            return Response(
                {'success': False, 'error': 'name, email, and message are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        inquiry_id = f"inq-{uuid.uuid4().hex[:12]}"
        inquiry = Inquiry.objects.create(
            id=inquiry_id,
            name=data.get('name'),
            email=data.get('email'),
            message=data.get('message')
        )

        user = save_or_update_user(data.get('name'), data.get('email'))
        if user:
            inquiry.user = user
            inquiry.save(update_fields=['user'])

        return Response({'success': True, 'id': inquiry_id, 'data': InquirySerializer(inquiry).data},
                        status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({'success': False, 'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PUT', 'DELETE'])
def inquiry_detail_compat(request, inquiry_id):
    """Update or delete an inquiry."""
    try:
        inquiry = Inquiry.objects.get(id=inquiry_id)
    except Inquiry.DoesNotExist:
        return Response({'success': False, 'error': 'Inquiry not found'}, status=status.HTTP_404_NOT_FOUND)
    if request.method == 'DELETE':
        inquiry.delete()
        return Response({'success': True})
    data = request.data
    if 'status' in data:
        inquiry.status = data['status']
    inquiry.save()
    return Response({'success': True})


@api_view(['GET', 'POST'])
def registrations_compat(request):
    """Node.js-compatible registrations endpoint."""
    if request.method == 'GET':
        registrations = EventRegistration.objects.all()
        return Response(EventRegistrationSerializer(registrations, many=True).data)
    data = request.data
    attendee_name = data.get('full_name') or data.get('attendee_name')
    attendee_email = data.get('user_email') or data.get('attendee_email')
    event_id = data.get('event_id')
    if not event_id or not attendee_name or not attendee_email:
        return Response(
            {'success': False, 'error': 'event_id, full_name, and user_email are required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    reg_id = f"reg-{uuid.uuid4().hex[:12]}"
    event_title = ''
    if event_id:
        try:
            event_obj = Event.objects.get(id=event_id)
            event_title = event_obj.title
        except Event.DoesNotExist:
            event_title = data.get('event_title', '')
    registration = EventRegistration.objects.create(
        id=reg_id,
        event_id=event_id,
        event_title=event_title,
        attendee_name=attendee_name,
        attendee_email=attendee_email,
        attendee_phone=data.get('phone', ''),
    )

    user = save_or_update_user(attendee_name, attendee_email)
    if user:
        registration.user = user
        registration.save(update_fields=['user'])

    return Response({'success': True, 'id': reg_id, 'data': EventRegistrationSerializer(registration).data},
                    status=status.HTTP_201_CREATED)


@api_view(['GET', 'POST'])
def demo_requests_compat(request):
    """Node.js-compatible demo requests endpoint."""
    if request.method == 'GET':
        demos = DemoRequest.objects.all()
        return Response(DemoRequestSerializer(demos, many=True).data)
    name = request.data.get('name') or request.data.get('full_name')
    email = request.data.get('email')
    if not name or not email:
        return Response(
            {'success': False, 'error': 'name and email are required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    demo_id = f"demo-{uuid.uuid4().hex[:12]}"
    demo = DemoRequest.objects.create(
        id=demo_id,
        name=name,
        email=email,
        phone=request.data.get('phone', ''),
        preferred_date=request.data.get('preferred_date', ''),
        service=request.data.get('service') or request.data.get('interested_service', ''),
        message=request.data.get('message', ''),
        country=request.data.get('country', '')
    )

    user = save_or_update_user(name, email)
    if user:
        demo.user = user
        demo.save(update_fields=['user'])

    return Response({'success': True, 'id': demo_id, 'data': DemoRequestSerializer(demo).data},
                    status=status.HTTP_201_CREATED)


@api_view(['GET'])
def demos_list_raw(request):
    """Alias for demo requests list (Node.js compatibility)."""
    demos = DemoRequest.objects.all()
    return Response(DemoRequestSerializer(demos, many=True).data)


@api_view(['GET'])
def registrations_list(request):
    """Return all event registrations as a raw array."""
    registrations = EventRegistration.objects.all()
    return Response(EventRegistrationSerializer(registrations, many=True).data)


@api_view(['POST'])
def registration_create(request):
    """Create registration using Node.js field names."""
    data = request.data
    attendee_name = data.get('full_name') or data.get('attendee_name')
    attendee_email = data.get('user_email') or data.get('attendee_email')
    event_id = data.get('event_id')
    if not event_id or not attendee_name or not attendee_email:
        return Response(
            {'success': False, 'error': 'event_id, full_name, and user_email are required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    reg_id = f"reg-{uuid.uuid4().hex[:12]}"
    event_title = ''
    if event_id:
        try:
            event_obj = Event.objects.get(id=event_id)
            event_title = event_obj.title
        except Event.DoesNotExist:
            event_title = data.get('event_title', '')
    registration = EventRegistration.objects.create(
        id=reg_id,
        event_id=event_id,
        event_title=event_title,
        attendee_name=attendee_name,
        attendee_email=attendee_email,
        attendee_phone=data.get('phone', ''),
    )

    user = save_or_update_user(attendee_name, attendee_email)
    if user:
        registration.user = user
        registration.save(update_fields=['user'])

    return Response({'success': True, 'id': reg_id, 'data': EventRegistrationSerializer(registration).data},
                    status=status.HTTP_201_CREATED)


@api_view(['PUT', 'DELETE'])
def registration_detail(request, reg_id):
    """Update or delete a registration by ID."""
    try:
        registration = EventRegistration.objects.get(id=reg_id)
    except EventRegistration.DoesNotExist:
        return Response({'success': False, 'error': 'Registration not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'DELETE':
        registration.delete()
        return Response({'success': True})

    status_val = request.data.get('status')
    if status_val:
        registration.status = status_val
        registration.save()
        return Response({'success': True, 'data': EventRegistrationSerializer(registration).data})

    return Response({'success': False, 'error': 'No fields to update'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT'])
def inquiry_update(request, inquiry_id):
    """Update inquiry status."""
    try:
        inquiry = Inquiry.objects.get(id=inquiry_id)
        inquiry.save()
        return Response({'success': True})
    except Inquiry.DoesNotExist:
        return Response({'success': False, 'error': 'Inquiry not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['DELETE'])
def inquiry_delete(request, inquiry_id):
    """Delete an inquiry."""
    try:
        inquiry = Inquiry.objects.get(id=inquiry_id)
        inquiry.delete()
        return Response({'success': True})
    except Inquiry.DoesNotExist:
        return Response({'success': False, 'error': 'Inquiry not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['DELETE'])
def demo_delete(request, demo_id):
    """Delete a demo request."""
    try:
        demo = DemoRequest.objects.get(id=demo_id)
        demo.delete()
        return Response({'success': True})
    except DemoRequest.DoesNotExist:
        return Response({'success': False, 'error': 'Demo request not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['PUT', 'DELETE'])
def demo_update(request, demo_id):
    """Update or delete demo request."""
    try:
        demo = DemoRequest.objects.get(id=demo_id)
    except DemoRequest.DoesNotExist:
        return Response({'success': False, 'error': 'Demo request not found'}, status=status.HTTP_404_NOT_FOUND)
    if request.method == 'DELETE':
        demo.delete()
        return Response({'success': True})
    data = request.data
    if 'status' in data:
        demo.status = data['status']
    demo.save()
    return Response({'success': True})


# ============ USER ENDPOINTS ============

@api_view(['GET'])
def users_list(request):
    """Get all users"""
    try:
        users = User.objects.all()
        from .serializers import UserSerializer
        serializer = UserSerializer(users, many=True)
        return Response({'success': True, 'data': serializer.data, 'count': users.count()})
    except Exception as e:
        return Response({'success': False, 'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# ============ VISITS ENDPOINTS ============

from .models import PageVisit


@api_view(['GET'])
def visits_list(request):
    """Get all page visit records"""
    try:
        visits = PageVisit.objects.all()
        data = [{'date': v.date.isoformat(), 'visits': v.visits} for v in visits]
        total_visitors = sum(v['visits'] for v in data)
        return Response({'success': True, 'data': data, 'total_visitors': total_visitors, 'count': len(data)})
    except Exception as e:
        return Response({'success': False, 'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ============ AUTH ENDPOINTS ============

@csrf_exempt
@api_view(['POST'])
def admin_login(request):
    """Admin login — creates a server-side session."""
    try:
        username = request.data.get('username', '').strip()
        password = request.data.get('password', '').strip()

        if not username or not password:
            return Response({'success': False, 'error': 'Username and password are required'},
                            status=status.HTTP_400_BAD_REQUEST)

        if username == settings.ADMIN_USERNAME and password == settings.ADMIN_PASSWORD:
            request.session['is_admin'] = True
            request.session['admin_username'] = username
            request.session['login_time'] = datetime.now().isoformat()
            return Response({'success': True, 'username': username})
        else:
            return Response({'success': False, 'error': 'Invalid username or password'},
                            status=status.HTTP_401_UNAUTHORIZED)
    except Exception as e:
        return Response({'success': False, 'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@csrf_exempt
@api_view(['POST'])
def admin_logout(request):
    """Admin logout — destroys the server-side session."""
    try:
        request.session.flush()
        return Response({'success': True})
    except Exception as e:
        return Response({'success': False, 'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def admin_me(request):
    """Check if admin is logged in — returns session info or 401."""
    if request.session.get('is_admin'):
        return Response({
            'success': True,
            'username': request.session.get('admin_username'),
            'login_time': request.session.get('login_time')
        })
    return Response({'success': False, 'error': 'Not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)


@csrf_exempt
@api_view(['POST'])
def admin_change_password(request):
    """Change admin credentials — validates current password, then updates .env."""
    if not request.session.get('is_admin'):
        return Response({'success': False, 'error': 'Not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)

    try:
        current = request.data.get('current_password', '')
        new_username = request.data.get('new_username', '').strip()
        new_password = request.data.get('new_password', '').strip()

        if current != settings.ADMIN_PASSWORD:
            return Response({'success': False, 'error': 'Current password is incorrect'},
                            status=status.HTTP_400_BAD_REQUEST)

        if not new_username or not new_password:
            return Response({'success': False, 'error': 'New username and password are required'},
                            status=status.HTTP_400_BAD_REQUEST)

        if len(new_password) < 4:
            return Response({'success': False, 'error': 'Password must be at least 4 characters'},
                            status=status.HTTP_400_BAD_REQUEST)

        # Read .env, update lines, write back
        import os
        env_path = os.path.join(settings.BASE_DIR, '.env')
        lines = []
        with open(env_path, 'r') as f:
            for line in f:
                if line.startswith('ADMIN_USERNAME='):
                    lines.append(f'ADMIN_USERNAME={new_username}\n')
                elif line.startswith('ADMIN_PASSWORD='):
                    lines.append(f'ADMIN_PASSWORD={new_password}\n')
                else:
                    lines.append(line)

        with open(env_path, 'w') as f:
            f.writelines(lines)

        # Also update the in-memory settings
        from django.conf import settings as django_settings
        django_settings.ADMIN_USERNAME = new_username
        django_settings.ADMIN_PASSWORD = new_password

        # Destroy session so user must re-login
        request.session.flush()

        return Response({'success': True, 'message': 'Credentials updated. Please login again.'})
    except Exception as e:
        return Response({'success': False, 'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ============ FEEDBACK ENDPOINTS ============

@api_view(['GET'])
def feedback_list(request):
    """Get all feedback entries"""
    try:
        items = Feedback.objects.all()
        return Response({'success': True, 'data': FeedbackSerializer(items, many=True).data, 'count': items.count()})
    except Exception as e:
        return Response({'success': False, 'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def create_feedback(request):
    """Create feedback entry"""
    try:
        data = request.data
        if not data.get('name') or not data.get('email'):
            return Response({'success': False, 'error': 'name and email are required'}, status=status.HTTP_400_BAD_REQUEST)
        fb_id = f"fb-{uuid.uuid4().hex[:12]}"
        try:
            rating = int(data.get('satisfaction_rating', 0)) if data.get('satisfaction_rating') else None
        except (ValueError, TypeError):
            rating = None
        fb = Feedback.objects.create(
            id=fb_id,
            name=data.get('name'),
            email=data.get('email'),
            service_used=data.get('service_used', ''),
            satisfaction_rating=rating,
            recommendation=data.get('recommendation', '')
        )
        user = save_or_update_user(data.get('name'), data.get('email'))
        if user:
            fb.user = user
            fb.save(update_fields=['user'])
        return Response({'success': True, 'data': FeedbackSerializer(fb).data}, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({'success': False, 'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET', 'POST'])
def feedback_compat(request):
    """Node.js-compatible feedback endpoint."""
    if request.method == 'GET':
        items = Feedback.objects.all()
        return Response(FeedbackSerializer(items, many=True).data)
    try:
        data = request.data
        if not data.get('name') or not data.get('email'):
            return Response({'success': False, 'error': 'name and email are required'}, status=status.HTTP_400_BAD_REQUEST)
        fb_id = f"fb-{uuid.uuid4().hex[:12]}"
        try:
            rating = int(data.get('satisfaction_rating', 0)) if data.get('satisfaction_rating') else None
        except (ValueError, TypeError):
            rating = None
        fb = Feedback.objects.create(
            id=fb_id,
            name=data.get('name'),
            email=data.get('email'),
            service_used=data.get('service_used', ''),
            satisfaction_rating=rating,
            recommendation=data.get('recommendation', '')
        )
        user = save_or_update_user(data.get('name'), data.get('email'))
        if user:
            fb.user = user
            fb.save(update_fields=['user'])
        return Response({'success': True, 'id': fb_id, 'data': FeedbackSerializer(fb).data}, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({'success': False, 'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PUT', 'DELETE'])
def feedback_detail_compat(request, feedback_id):
    """Update or delete a feedback entry"""
    try:
        fb = Feedback.objects.get(id=feedback_id)
    except Feedback.DoesNotExist:
        return Response({'success': False, 'error': 'Feedback not found'}, status=status.HTTP_404_NOT_FOUND)
    if request.method == 'DELETE':
        fb.delete()
        return Response({'success': True})
    data = request.data
    if 'status' in data:
        fb.status = data['status']
    fb.save()
    return Response({'success': True})


# ============ HEALTH/INFO ENDPOINTS ============

@api_view(['GET'])
def health_check(request):
    """Health check endpoint"""
    return Response({
        'status': 'ok',
        'service': 'AI Solutions API',
        'timestamp': datetime.now().isoformat()
    })


@api_view(['GET'])
def api_info(request):
    """Get API information"""
    return Response({
        'name': 'AI Solutions API',
        'version': '1.0.0',
        'endpoints': {
            'events': '/api/events/',
            'chat': '/api/chat/',
            'inquiries': '/api/inquiries/',
            'demos': '/api/demo-requests/',
            'jobs': '/api/jobs/',
            'health': '/api/health/'
        }
    })

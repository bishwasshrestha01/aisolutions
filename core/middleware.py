from datetime import date
from django.utils.deprecation import MiddlewareMixin
from .models import PageVisit


class VisitTrackingMiddleware(MiddlewareMixin):
    def process_response(self, request, response):
        if not request.path.startswith('/static/') and not request.path.startswith('/photos/'):
            today = date.today()
            visit, _ = PageVisit.objects.get_or_create(date=today, defaults={'visits': 0})
            PageVisit.objects.filter(date=today).update(visits=visit.visits + 1)
        return response

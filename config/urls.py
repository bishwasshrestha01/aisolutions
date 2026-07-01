"""
URL configuration for AI Solutions project.
Serves both the Django API and the static website files.
"""
import os, mimetypes
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.views.static import serve
from django.http import FileResponse, Http404
from django.shortcuts import redirect

def panel_view(request, path=''):
    """Serve admin panel files, auto-appending .html when needed."""
    admin_dir = os.path.join(settings.BASE_DIR, 'admin')
    if not path or path.endswith('/'):
        path = 'index.html'
    elif '/' not in path and '.' not in path:
        path = path + '.html'
    filepath = os.path.join(admin_dir, path)
    if os.path.isfile(filepath):
        content_type, _ = mimetypes.guess_type(filepath)
        return FileResponse(open(filepath, 'rb'), content_type=content_type or 'text/html')
    raise Http404(f'Panel page not found: {path}')

urlpatterns = [
    path('api/', include('core.urls')),
]

if settings.DEBUG:
    django_static_dir = os.path.join(settings.BASE_DIR, 'static')
    urlpatterns += [
        path('static/<path:path>', serve, {'document_root': django_static_dir}),
    ]
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

    # Website asset directories
    asset_dirs = ['css', 'js', 'photos', 'chatbot']
    for d in asset_dirs:
        full = os.path.join(settings.BASE_DIR, d)
        if os.path.isdir(full):
            urlpatterns += [
                path(f'{d}/<path:path>', serve, {'document_root': full}),
            ]

    # Admin panel at /panel/ (clean URLs, .html auto-appended)
    urlpatterns += [
        path('panel/', panel_view),
        path('panel', lambda r: redirect('panel/')),
        path('panel/<path:path>', panel_view),
    ]

    # Admin at /admin/ (serves admin/index.html, etc.)
    urlpatterns += [
        path('admin/', panel_view),
        path('admin', lambda r: redirect('admin/')),
        path('admin/<path:path>', panel_view),
    ]

    # Website HTML pages
    urlpatterns += [
        path('', serve, {'document_root': settings.BASE_DIR, 'path': 'index.html'}),
        re_path(r'^(?P<path>.*\.html)$', serve, {'document_root': settings.BASE_DIR}),
    ]

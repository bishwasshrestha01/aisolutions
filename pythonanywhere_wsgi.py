import os
import sys

# === 1. Project path ===
project_home = '/home/bishwasshrestha01/aisolutions'
if project_home not in sys.path:
    sys.path.insert(0, project_home)

# === 2. Virtual environment activation ===
venv_path = project_home + '/venv'
activate_this = venv_path + '/bin/activate_this.py'
if os.path.exists(activate_this):
    with open(activate_this) as f:
        exec(f.read(), {'__file__': activate_this})
else:
    # Fallback: manually add venv site-packages
    import site
    python_ver = f"python{sys.version_info.major}.{sys.version_info.minor}"
    site_packages = f"{venv_path}/lib/{python_ver}/site-packages"
    if os.path.exists(site_packages):
        site.addsitedir(site_packages)

# === 3. Environment variables (fill in your values) ===
os.environ['DJANGO_SETTINGS_MODULE'] = 'config.settings'
os.environ['DEBUG'] = 'False'
os.environ['SECRET_KEY'] = 'your-strong-secret-key-here'
os.environ['ALLOWED_HOSTS'] = 'bishwasshrestha01.pythonanywhere.com'
os.environ['OPENROUTER_API_KEY'] = 'your-key-here'
os.environ['ADMIN_USERNAME'] = 'admin'
os.environ['ADMIN_PASSWORD'] = 'your-password-here'

# === 4. Start Django ===
from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()

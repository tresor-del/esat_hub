from pathlib import Path
from jinja2 import Environment, FileSystemLoader

# On définit le chemin vers le dossier templates
BASE_DIR = Path(__file__).resolve().parent.parent
TEMPLATES_DIR = BASE_DIR / "templates" / "emails"

# On crée l'environnement Jinja2 une seule fois
email_templates = Environment(
    loader=FileSystemLoader(str(TEMPLATES_DIR)),
    autoescape=select_autoescape(['html', 'xml'])
)

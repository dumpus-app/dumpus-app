"""API Gateway HTTP API → Flask via apig-wsgi."""
import sys
from pathlib import Path

# `src/` must be on sys.path so the existing flat-module imports (`from tasks import ...`)
# keep working when this module is loaded from `src/lambda_handlers/api.py`.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import secrets_loader
from apig_wsgi import make_lambda_handler
from app import app

handler = make_lambda_handler(app)

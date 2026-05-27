"""
Flask application factory.
"""

import logging
import os
import secrets
from pathlib import Path

from flask import Flask

from app import config as cfg_module


def create_app() -> Flask:
    app = Flask(__name__, template_folder="templates")

    # Secret key: use a stable per-installation key stored in config,
    # so sessions survive app restarts without re-prompting the user.
    cfg = cfg_module.load()
    flask_secret = os.environ.get("FLASK_SECRET_KEY") or ""
    if not flask_secret:
        # Generate once and persist — never visible to user
        flask_secret = secrets.token_hex(32)
        cfg_module.update(flask_secret=flask_secret)
    app.secret_key = flask_secret

    from app.routes import bp
    app.register_blueprint(bp)

    return app

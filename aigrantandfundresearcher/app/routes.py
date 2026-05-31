"""
All Flask routes for AIGrantAndFundResearcher.
Setup is 3 steps: film details → Anthropic key → connect email.
No license key screen — the Gumroad/Lemon Squeezy download link is the gate.
"""

import logging
import subprocess
import sys
from pathlib import Path

from flask import (
    Blueprint,
    jsonify,
    redirect,
    render_template,
    request,
    url_for,
)

import app.config as config
from app.email_drafts.personalizer import test_api_key
from app.email_drafts import gmail_drafter, outlook_drafter
from app import pipeline

bp = Blueprint("main", __name__)
logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _setup_complete(cfg: dict) -> bool:
    return bool(
        cfg.get("full_name")
        and cfg.get("film_title")
        and cfg.get("cause_area")
        and cfg.get("anthropic_api_key")
        and cfg.get("email_provider")
    )


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

@bp.route("/")
def index():
    cfg = config.load()
    if not _setup_complete(cfg):
        return redirect(url_for("main.setup_step", step=1))
    return redirect(url_for("main.dashboard"))


# ---------------------------------------------------------------------------
# Setup wizard — 3 steps
# Step 1: Film details
# Step 2: Anthropic API key
# Step 3: Connect email
# ---------------------------------------------------------------------------

@bp.route("/setup/<int:step>", methods=["GET", "POST"])
def setup_step(step: int):
    cfg = config.load()

    if step == 1:
        if request.method == "POST":
            full_name  = (request.form.get("full_name")  or "").strip()
            email      = (request.form.get("email")      or "").strip()
            film_title = (request.form.get("film_title") or "").strip()
            logline    = (request.form.get("logline")    or "").strip()
            cause_area = (request.form.get("cause_area") or "").strip()

            errors = {}
            if not full_name:
                errors["full_name"] = "Required."
            if not film_title:
                errors["film_title"] = "Required."
            if not cause_area:
                errors["cause_area"] = "Required."

            if errors:
                return render_template("setup.html", step=1, errors=errors,
                                       values=request.form)

            spreadsheet_path = str(config.spreadsheet_default_path(film_title))
            config.update(
                full_name=full_name,
                email=email,
                film_title=film_title,
                logline=logline,
                cause_area=cause_area,
                spreadsheet_path=spreadsheet_path,
            )
            return redirect(url_for("main.setup_step", step=2))
        return render_template("setup.html", step=1, values=cfg)

    if step == 2:
        if request.method == "POST":
            api_key = (request.form.get("anthropic_api_key") or "").strip()
            ok, msg = test_api_key(api_key)
            if ok:
                config.update(anthropic_api_key=api_key)
                return redirect(url_for("main.setup_step", step=3))
            return render_template("setup.html", step=2, error=msg)
        return render_template("setup.html", step=2)

    if step == 3:
        provider = cfg.get("email_provider", "")
        connected = bool(provider and (
            cfg.get("gmail_access_token") or cfg.get("outlook_access_token")
        ))
        return render_template("setup.html", step=3,
                               provider=provider, connected=connected)

    return redirect(url_for("main.dashboard"))


@bp.route("/setup/connect-gmail")
def connect_gmail():
    ok, msg = gmail_drafter.run_oauth_flow()
    if ok:
        return redirect(url_for("main.setup_step", step=3))
    return render_template("setup.html", step=3, error=msg)


@bp.route("/setup/connect-outlook")
def connect_outlook():
    ok, msg = outlook_drafter.run_oauth_flow()
    if ok:
        return redirect(url_for("main.setup_step", step=3))
    return render_template("setup.html", step=3, error=msg)


@bp.route("/setup/complete")
def setup_complete():
    return redirect(url_for("main.dashboard"))


# ---------------------------------------------------------------------------
# Dashboard
# ---------------------------------------------------------------------------

@bp.route("/dashboard")
def dashboard():
    cfg = config.load()
    if not _setup_complete(cfg):
        return redirect(url_for("main.index"))
    error = request.args.get("error", "")
    return render_template("dashboard.html", cfg=cfg, error=error)


# ---------------------------------------------------------------------------
# Run pipeline
# ---------------------------------------------------------------------------

@bp.route("/run", methods=["POST"])
def run():
    cfg = config.load()
    if not _setup_complete(cfg):
        return redirect(url_for("main.index"))
    started = pipeline.start_pipeline_thread()
    if not started:
        return redirect(url_for("main.dashboard") + "?error=already_running")
    return render_template("dashboard.html", cfg=cfg, running=True)


@bp.route("/status")
def status():
    """Polled every 2 s by the dashboard during a run."""
    return jsonify(pipeline.get_status())


# ---------------------------------------------------------------------------
# Results
# ---------------------------------------------------------------------------

@bp.route("/results")
def results():
    s = pipeline.get_status()
    res = s.get("results") or {}
    cfg = config.load()
    return render_template("results.html", cfg=cfg, results=res,
                           no_new=not res.get("new_contacts"))


# ---------------------------------------------------------------------------
# Settings
# ---------------------------------------------------------------------------

@bp.route("/settings")
def settings():
    return redirect(url_for("main.setup_step", step=1))


# ---------------------------------------------------------------------------
# Open spreadsheet in Finder / Explorer
# ---------------------------------------------------------------------------

@bp.route("/open-spreadsheet")
def open_spreadsheet():
    cfg = config.load()
    path = cfg.get("spreadsheet_path", "")
    if path and Path(path).exists():
        if sys.platform == "darwin":
            subprocess.Popen(["open", path])
        elif sys.platform == "win32":
            subprocess.Popen(["explorer", path])
        else:
            subprocess.Popen(["xdg-open", path])
    return redirect(url_for("main.dashboard"))

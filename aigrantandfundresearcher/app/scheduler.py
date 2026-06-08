"""
Background scheduler — fires the pipeline at the user-configured time (default 2 AM daily).
Uses APScheduler's BackgroundScheduler so it runs in-process without a separate daemon.

The app must be open at the scheduled time for the job to fire. If the computer was off
or the app was closed, a missed-run check at startup triggers a catch-up run automatically.
"""

import logging
import os
from datetime import datetime

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

import app.config as config
from app import pipeline

logger = logging.getLogger(__name__)

_scheduler: BackgroundScheduler | None = None
_JOB_ID = "nightly_pipeline"


def start() -> None:
    """Start the background scheduler. Called once from create_app()."""
    global _scheduler
    if _scheduler is not None:
        return

    _scheduler = BackgroundScheduler(daemon=True)
    _reschedule()
    _scheduler.start()
    _check_missed_run()
    logger.info("Scheduler started")


def _reschedule() -> None:
    """Read config and (re)schedule the nightly job."""
    if _scheduler is None:
        return
    cfg = config.load()
    if _scheduler.get_job(_JOB_ID):
        _scheduler.remove_job(_JOB_ID)
    if not cfg.get("schedule_enabled", True):
        return
    hour   = int(cfg.get("schedule_hour",   2))
    minute = int(cfg.get("schedule_minute", 0))
    _scheduler.add_job(
        _run_job,
        CronTrigger(hour=hour, minute=minute),
        id=_JOB_ID,
        name="Nightly funder search",
        replace_existing=True,
    )
    logger.info("Nightly pipeline scheduled at %02d:%02d local time", hour, minute)


def _run_job() -> None:
    cfg = config.load()
    required = ["full_name", "film_title", "cause_area", "anthropic_api_key", "email_provider"]
    if not all(cfg.get(k) for k in required):
        logger.info("Scheduler: setup incomplete — skipping nightly run")
        return
    logger.info("Scheduler: triggering nightly pipeline")
    pipeline.start_pipeline_thread()


def _check_missed_run() -> None:
    """
    If the scheduled run should have fired earlier today (or yesterday) but didn't —
    because the app was closed — run immediately as a catch-up.
    """
    cfg = config.load()
    if not cfg.get("schedule_enabled", True):
        return
    required = ["full_name", "film_title", "cause_area", "anthropic_api_key", "email_provider"]
    if not all(cfg.get(k) for k in required):
        return

    last_run_str = cfg.get("last_run_at", "")
    if not last_run_str:
        return  # Never run — don't auto-trigger on very first startup

    hour   = int(cfg.get("schedule_hour",   2))
    minute = int(cfg.get("schedule_minute", 0))

    now = datetime.now()
    scheduled_today = now.replace(hour=hour, minute=minute, second=0, microsecond=0)

    if now < scheduled_today:
        return  # Hasn't hit today's scheduled time yet

    try:
        last_run = datetime.fromisoformat(last_run_str.replace("Z", "+00:00"))
        last_run_naive = last_run.astimezone().replace(tzinfo=None)
    except Exception:
        return

    if last_run_naive < scheduled_today:
        logger.info("Missed scheduled run detected — triggering catch-up run")
        pipeline.start_pipeline_thread()


def toggle(enabled: bool) -> None:
    """Enable or disable the nightly auto-run."""
    config.update(schedule_enabled=enabled)
    _reschedule()


def is_enabled() -> bool:
    return bool(config.load().get("schedule_enabled", True))


def get_next_run_display() -> str:
    """Return a human-friendly string like 'Tonight at 2:00 AM' or 'Auto-run disabled'."""
    if _scheduler is None:
        return "Scheduler not running"
    job = _scheduler.get_job(_JOB_ID)
    if job is None or job.next_run_time is None:
        return "Auto-run disabled"
    nxt = job.next_run_time.astimezone()  # convert to local tz
    now = datetime.now().astimezone()
    hours_away = (nxt - now).total_seconds() / 3600
    if hours_away < 20:
        day_label = "Tonight"
    elif hours_away < 44:
        day_label = "Tomorrow"
    else:
        day_label = nxt.strftime("%A")  # e.g. "Thursday"
    hour_12 = nxt.hour % 12 or 12
    ampm    = "AM" if nxt.hour < 12 else "PM"
    return f"{day_label} at {hour_12}:{nxt.minute:02d} {ampm}"

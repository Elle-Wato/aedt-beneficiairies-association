"""Optional email alerts to the office when a form comes in. Needs SMTP_* settings; silently off otherwise."""
import logging
import smtplib
import threading
from email.message import EmailMessage

log = logging.getLogger("aedt.notify")


def send_async(cfg, subject, body):
    if not (cfg.get("SMTP_HOST") and cfg.get("NOTIFY_EMAIL")):
        return
    threading.Thread(target=_send, args=(dict(cfg), subject, body), daemon=True).start()


def _send(cfg, subject, body):
    try:
        msg = EmailMessage()
        msg["Subject"] = subject
        msg["From"] = cfg.get("SMTP_FROM") or cfg["SMTP_USER"]
        msg["To"] = cfg["NOTIFY_EMAIL"]
        msg.set_content(body)
        with smtplib.SMTP(cfg["SMTP_HOST"], int(cfg.get("SMTP_PORT") or 587), timeout=20) as s:
            s.starttls()
            if cfg.get("SMTP_USER"):
                s.login(cfg["SMTP_USER"], cfg["SMTP_PASSWORD"])
            s.send_message(msg)
    except Exception:  # never break a form because email failed
        log.exception("Could not send notification email")

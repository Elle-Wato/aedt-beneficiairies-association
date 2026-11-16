"""Entry point. Local:  flask --app app run --debug    Production:  gunicorn app:app"""
import os

from aedt import create_app

try:                                    # read settings from a .env file if python-dotenv is installed
    from dotenv import load_dotenv
    load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))
except ImportError:
    pass

app = create_app()

if __name__ == "__main__":
    app.run(debug=True, port=int(os.environ.get("PORT", 5000)))

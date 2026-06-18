import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(dotenv_path=BASE_DIR / '.env')

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key')
    MONGO_URI = os.environ.get('MONGO_URI')
    ANTHROPIC_API_KEY = os.environ.get('ANTHROPIC_API_KEY')
    TWILIO_SID = os.environ.get('TWILIO_SID')
    TWILIO_AUTH = os.environ.get('TWILIO_AUTH')
    TWILIO_PHONE = os.environ.get('TWILIO_PHONE')
    REDIS_URL = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')

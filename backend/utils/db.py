import os
from google.cloud import firestore
from google.oauth2 import service_account

# Configuration
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SERVICE_ACCOUNT_FILE = os.path.join(BASE_DIR, 'service-account.json')
PROJECT_ID = 'opnionnewsletter'
DATABASE_ID = 'opinionnewsletterdb' # Detected successfully

_db_client = None

def get_db():
    global _db_client
    if _db_client is None:
        try:
            if os.path.exists(SERVICE_ACCOUNT_FILE):
                credentials = service_account.Credentials.from_service_account_file(SERVICE_ACCOUNT_FILE)
                _db_client = firestore.Client(
                    credentials=credentials, 
                    project=PROJECT_ID, 
                    database=DATABASE_ID
                )
            else:
                # Use Application Default Credentials (ADC) when deployed to Cloud Run
                _db_client = firestore.Client(
                    project=PROJECT_ID, 
                    database=DATABASE_ID
                )
        except Exception as e:
            print(f"Error connecting to DB: {e}")
            raise e
    return _db_client

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
            # Check if running in Cloud Run (K_SERVICE is set automatically)
            is_cloud_run = os.getenv('K_SERVICE') or os.getenv('K_JOB')
            
            if not is_cloud_run and os.path.exists(SERVICE_ACCOUNT_FILE):
                print(f"Using local service account file: {SERVICE_ACCOUNT_FILE}")
                credentials = service_account.Credentials.from_service_account_file(SERVICE_ACCOUNT_FILE)
                _db_client = firestore.Client(
                    credentials=credentials, 
                    project=PROJECT_ID, 
                    database=DATABASE_ID
                )
            else:
                print("Using Application Default Credentials (ADC) for Cloud environment.")
                # When deployed to Cloud Run, ADC should handle authentication
                _db_client = firestore.Client(
                    project=PROJECT_ID, 
                    database=DATABASE_ID
                )
        except Exception as e:
            print(f"Error connecting to DB: {e}")
            # Log more details about environment
            print(f"DEBUG: BASE_DIR={BASE_DIR}")
            print(f"DEBUG: K_SERVICE={os.getenv('K_SERVICE')}, K_JOB={os.getenv('K_JOB')}")
            try:
                print(f"DEBUG: Files in BASE_DIR: {os.listdir(BASE_DIR)}")
            except:
                pass
            raise e
    return _db_client

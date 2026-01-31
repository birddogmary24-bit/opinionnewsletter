from google.oauth2 import service_account
from google.cloud import firestore
import datetime
import os

# Configuration
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SERVICE_ACCOUNT_FILE = os.path.join(BASE_DIR, 'service-account.json')
PROJECT_ID = 'opnionnewsletter'

def test_firestore_connection(db_name='(default)'):
    try:
        print(f"\n--- Testing DB: {db_name} ---")
        if not os.path.exists(SERVICE_ACCOUNT_FILE):
            print(f"Error: {SERVICE_ACCOUNT_FILE} not found.")
            return False

        credentials = service_account.Credentials.from_service_account_file(SERVICE_ACCOUNT_FILE)
        
        # Explicitly pass the database name
        db = firestore.Client(credentials=credentials, project=PROJECT_ID, database=db_name)

        doc_ref = db.collection('test_collection').document('connection_test')
        doc_ref.set({
            'message': 'Hello from Backend!',
            'timestamp': datetime.datetime.now(),
            'status': 'success'
        })
        print(f"✅ Write Successful to {db_name}!")
        return True

    except Exception as e:
        print(f"❌ Failed for {db_name}: {e}")
        return False

if __name__ == "__main__":
    # Candidate database names to try
    candidates = [
        '(default)', 
        'opinionnewsletterdb', 
        'opnionnewsletterdb',
        'opinionnewsletter',
        'opnionnewsletter'
    ]
    
    success = False
    for db_name in candidates:
        if test_firestore_connection(db_name):
            success = True
            break
    
    if not success:
        print("\n❌ All candidates failed. Please check the Database ID in GCP Console.")

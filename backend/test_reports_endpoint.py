import os
from dotenv import load_dotenv, find_dotenv
load_dotenv(find_dotenv(), override=True)

from fastapi.testclient import TestClient
from main import app
from auth import create_token

client = TestClient(app)

# Create a token for Jaishree (super_admin)
# Let's find the user first
from database import SessionLocal, User
db = SessionLocal()
user = db.query(User).filter(User.role == "super_admin").first()
if not user:
    user = db.query(User).first()
db.close()

if user:
    token = create_token(user_id=user.id, role=user.role)
    headers = {"Authorization": f"Bearer {token}"}
    client_id = "f07953e5-601d-4f27-a2da-bfd432b5b7fc"
    
    print(f"Calling GET /api/clients/{client_id}/reports...")
    response = client.get(f"/api/clients/{client_id}/reports", headers=headers)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text[:200]}...")
else:
    print("No user found in DB to test with.")

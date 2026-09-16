import pytest
import os
import sys
from bson import ObjectId

# Ensure workspace root is in path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.app import create_app
from backend.config import Config
from backend.app.extensions import Database, hash_password, generate_jwt_token

@pytest.fixture(scope="session")
def app():
    # Use test db
    app = create_app()
    app.config["TESTING"] = True
    yield app

@pytest.fixture(scope="session")
def client(app):
    return app.test_client()

@pytest.fixture(scope="session")
def mongo_db():
    return Database.get_db()

@pytest.fixture
def super_admin_token(mongo_db):
    user = mongo_db.users.find_one({"role": "SUPER_ADMIN"})
    if not user:
        res = mongo_db.users.insert_one({
            "name": "Super Admin Test",
            "email": "super_test@civicai.gov",
            "username": "super_test",
            "password_hash": hash_password("Password@123"),
            "role": "SUPER_ADMIN",
            "permissions": ["MANAGE_ADMINS", "VIEW_COMPLAINTS", "EMERGENCY_RESPONSE"],
            "active": True
        })
        user_id = str(res.inserted_id)
    else:
        user_id = str(user["_id"])

    token = generate_jwt_token({"sub": user_id, "role": "SUPER_ADMIN", "name": "Super Admin Test"})
    return token, user_id

@pytest.fixture
def client_user_token(mongo_db):
    uid = f"test_citizen_{ObjectId()}"
    res = mongo_db.users.insert_one({
        "name": "Test Citizen",
        "email": f"{uid}@example.com",
        "username": uid,
        "password_hash": hash_password("Password@123"),
        "role": "CLIENT",
        "active": True
    })
    token = generate_jwt_token({"sub": str(res.inserted_id), "role": "CLIENT", "name": "Test Citizen"})
    return token, str(res.inserted_id)

@pytest.fixture
def department_token(mongo_db):
    did = f"test_dept_{ObjectId()}"
    res = mongo_db.departments.insert_one({
        "department_name": f"Dept {did}",
        "department_email": f"{did}@civicai.gov",
        "username": did,
        "password_hash": hash_password("Password@123"),
        "role": "DEPARTMENT",
        "active": True
    })
    token = generate_jwt_token({"sub": str(res.inserted_id), "role": "DEPARTMENT", "name": f"Dept {did}"})
    return token, str(res.inserted_id)

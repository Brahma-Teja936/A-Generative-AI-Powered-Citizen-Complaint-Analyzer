import pytest
from bson import ObjectId

def test_client_registration_and_login(client, mongo_db):
    test_user = f"citizen_{ObjectId()}"
    # Register
    res_reg = client.post('/api/auth/register', json={
        "name": "Citizen Ramesh",
        "email": f"{test_user}@test.com",
        "username": test_user,
        "phone": "+919876543210",
        "password": "SecurePassword@123"
    })
    assert res_reg.status_code == 201
    assert "token" in res_reg.json
    assert res_reg.json["user"]["role"] == "CLIENT"

    # Verify password is not plaintext in DB
    db_user = mongo_db.users.find_one({"username": test_user})
    assert db_user is not None
    assert db_user["password_hash"] != "SecurePassword@123"
    assert db_user["password_hash"].startswith("$2b$")

    # Login
    res_log = client.post('/api/auth/login', json={
        "identifier": test_user,
        "password": "SecurePassword@123"
    })
    assert res_log.status_code == 200
    assert "token" in res_log.json

def test_super_admin_creates_admin_and_permissions(client, super_admin_token):
    admin_token, _ = super_admin_token
    new_admin_uname = f"sub_admin_{ObjectId()}"

    res = client.post('/api/admin/admins', headers={'Authorization': f'Bearer {admin_token}'}, json={
        "name": "Junior Admin",
        "email": f"{new_admin_uname}@civicai.gov",
        "username": new_admin_uname,
        "password": "StrongPassword@123",
        "permissions": ["VIEW_COMPLAINTS", "REVIEW_AI"]
    })
    assert res.status_code == 201
    assert res.json["role"] == "ADMIN"
    created_id = res.json["id"]

    # Deactivate Admin
    res_deact = client.put(f'/api/admin/admins/{created_id}/deactivate', headers={'Authorization': f'Bearer {admin_token}'})
    assert res_deact.status_code == 200

    # Attempt login as deactivated admin -> Must be 403 Forbidden!
    res_fail_login = client.post('/api/auth/admin/login', json={
        "identifier": new_admin_uname,
        "password": "StrongPassword@123"
    })
    assert res_fail_login.status_code == 403

def test_rbac_isolation(client, client_user_token, department_token):
    citizen_token, _ = client_user_token
    dept_token, _ = department_token

    # Citizen trying to access admin dashboard -> 403
    res_client_to_admin = client.get('/api/admin/dashboard', headers={'Authorization': f'Bearer {citizen_token}'})
    assert res_client_to_admin.status_code == 403

    # Department trying to access admin dashboard -> 403
    res_dept_to_admin = client.get('/api/admin/dashboard', headers={'Authorization': f'Bearer {dept_token}'})
    assert res_dept_to_admin.status_code == 403

    # Citizen trying to access department dashboard -> 403
    res_client_to_dept = client.get('/api/department/dashboard', headers={'Authorization': f'Bearer {citizen_token}'})
    assert res_client_to_dept.status_code == 403

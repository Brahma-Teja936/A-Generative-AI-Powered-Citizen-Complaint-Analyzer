import pytest
import datetime
from bson import ObjectId

def test_training_data_strict_isolation(client, mongo_db, super_admin_token, department_token, client_user_token):
    """
    CRITICAL ISOLATION TEST:
    Inserts known dummy training data records (both into training_complaints collection
    and with is_training_data: True, record_type: 'TRAINING') and verifies that NO
    production API returns them under any condition.
    """
    admin_token, _ = super_admin_token
    dept_token, _ = department_token
    citizen_token, _ = client_user_token

    # 1. Insert synthetic training records
    dummy_training_id = f"TRAIN-TEST-{ObjectId()}"
    mongo_db.training_complaints.insert_one({
        "complaint": "Synthetic training sentence about broken road",
        "department": "Roads & Infrastructure",
        "category": "Road Maintenance",
        "subcategory": "Potholes",
        "severity": "CRITICAL",
        "priority": "CRITICAL",
        "urgency": "IMMEDIATE",
        "is_training_data": True,
        "record_type": "TRAINING"
    })

    # Also test malicious/accidental insertion into complaints with is_training_data: True
    mongo_db.complaints.insert_one({
        "complaint_id": dummy_training_id,
        "title": "MALICIOUS TRAINING DATA LEAK TEST",
        "original_text": "Do not show this training data",
        "is_training_data": True,
        "record_type": "TRAINING",
        "severity": "CRITICAL",
        "urgency": "IMMEDIATE",
        "status": "SUBMITTED",
        "created_at": datetime.datetime.now(datetime.timezone.utc)
    })

    # Test 1: Admin complaint list API
    res = client.get('/api/admin/complaints', headers={'Authorization': f'Bearer {admin_token}'})
    assert res.status_code == 200
    ids = [item.get("complaint_id") for item in res.json.get("items", [])]
    assert dummy_training_id not in ids, "CRITICAL LEAK: Training complaint appeared in admin list!"

    # Test 2: Admin critical queue API
    res_crit = client.get('/api/admin/complaints/critical', headers={'Authorization': f'Bearer {admin_token}'})
    assert res_crit.status_code == 200
    crit_ids = [item.get("complaint_id") for item in res_crit.json.get("items", [])]
    assert dummy_training_id not in crit_ids, "CRITICAL LEAK: Training complaint appeared in critical queue!"

    # Test 3: Admin urgent queue API
    res_urg = client.get('/api/admin/complaints/urgent', headers={'Authorization': f'Bearer {admin_token}'})
    assert res_urg.status_code == 200
    urg_ids = [item.get("complaint_id") for item in res_urg.json.get("items", [])]
    assert dummy_training_id not in urg_ids, "CRITICAL LEAK: Training complaint appeared in urgent queue!"

    # Test 4: Admin dashboard counts
    res_dash = client.get('/api/admin/dashboard', headers={'Authorization': f'Bearer {admin_token}'})
    assert res_dash.status_code == 200
    # Counts should match only live complaints
    live_count = mongo_db.complaints.count_documents({"is_training_data": False, "record_type": "LIVE"})
    assert res_dash.json["summary"]["total"] == live_count, "CRITICAL LEAK: Dashboard total included training data!"

    # Test 5: Department complaint list
    res_dept = client.get('/api/department/complaints', headers={'Authorization': f'Bearer {dept_token}'})
    assert res_dept.status_code == 200
    dept_ids = [item.get("complaint_id") for item in res_dept.json.get("items", [])]
    assert dummy_training_id not in dept_ids, "CRITICAL LEAK: Training data leaked to department view!"

    # Test 6: Citizen complaint list
    res_client = client.get('/api/client/complaints', headers={'Authorization': f'Bearer {citizen_token}'})
    assert res_client.status_code == 200
    client_ids = [item.get("complaint_id") for item in res_client.json.get("items", [])]
    assert dummy_training_id not in client_ids, "CRITICAL LEAK: Training data leaked to citizen view!"

    # Test 7: Direct complaint lookup by ID
    res_detail = client.get(f'/api/admin/complaints/{dummy_training_id}', headers={'Authorization': f'Bearer {admin_token}'})
    assert res_detail.status_code == 404, "CRITICAL LEAK: Training complaint detail accessible by ID!"

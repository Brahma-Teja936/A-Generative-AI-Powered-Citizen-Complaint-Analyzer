import pytest
from bson import ObjectId
from backend.app.services.email_service import EmailService

def test_full_complaint_workflow_and_email_idempotency(client, mongo_db, client_user_token, super_admin_token, department_token):
    citizen_token, citizen_id = client_user_token
    admin_token, admin_id = super_admin_token
    dept_token, dept_id = department_token

    # 1. Citizen Submits Complaint (Telugu text example)
    sub_res = client.post('/api/client/complaints', headers={'Authorization': f'Bearer {citizen_token}'}, json={
        "title": "Severe drinking water contamination",
        "description": "డ్రింకింగ్ వాటర్ లో మురికి నీరు కలిసి వస్తోంది ప్రజలు రోగాల బారిన పడుతున్నారు త్వరగా పరిష్కరించండి.",
        "input_method": "VOICE",
        "address": "Kukatpally Phase 2, Hyderabad",
        "latitude": 17.4850,
        "longitude": 78.4100
    })
    assert sub_res.status_code == 201
    cmp_data = sub_res.json
    cid = cmp_data["complaint_id"]
    assert cid.startswith("CMP-")
    assert cmp_data["record_type"] == "LIVE"
    assert cmp_data["is_training_data"] is False
    assert "ai_prediction" in cmp_data

    # 2. Admin Reviews Complaint & Accepts AI Recommendation
    review_res = client.put(f'/api/admin/complaints/{cid}/decision', headers={'Authorization': f'Bearer {admin_token}'}, json={
        "accepted_ai": True,
        "department": cmp_data["department"],
        "severity": cmp_data["severity"],
        "priority": cmp_data["priority"],
        "urgency": cmp_data["urgency"],
        "admin_notes": "Reviewed and verified on map."
    })
    assert review_res.status_code == 200

    # 3. Admin Assigns Department
    assign_res = client.put(f'/api/admin/complaints/{cid}/assign', headers={'Authorization': f'Bearer {admin_token}'}, json={
        "department_id": dept_id
    })
    assert assign_res.status_code == 200
    assert assign_res.json["status"] == "ASSIGNED"

    # 4. Department Accepts Work Order
    accept_res = client.post(f'/api/department/complaints/{cid}/accept', headers={'Authorization': f'Bearer {dept_token}'})
    assert accept_res.status_code == 200

    # 5. Department Posts Progress Update
    prog_res = client.post(f'/api/department/complaints/{cid}/progress', headers={'Authorization': f'Bearer {dept_token}'}, data={
        "description": "Inspection team arrived. Pipe isolation valve turned off.",
        "status": "IN_PROGRESS",
        "estimated_completion": "2026-09-12"
    })
    assert prog_res.status_code == 201

    # 6. Department Resolves Complaint (This automatically sends resolution email with idempotency event_id)
    res_res = client.post(f'/api/department/complaints/{cid}/resolve', headers={'Authorization': f'Bearer {dept_token}'}, data={
        "resolution_description": "Contaminated line flushed and repaired. Water quality tested and cleared."
    })
    assert res_res.status_code == 200
    assert res_res.json["status"] == "RESOLVED"

    # 7. Test Email Idempotency (Section 54)
    # Attempting to re-send resolution email with same idempotency event_id -> MUST BE PREVENTED
    second_send = EmailService.send_resolution_email(
        complaint={"complaint_id": cid, "title": "Severe drinking water contamination"},
        client_email="test_citizen@example.com",
        resolution_desc="Repaired"
    )
    assert second_send["status"] == "DUPLICATE_PREVENTED", "Idempotency failed: duplicate email was not prevented!"

    # 8. Citizen Submits Feedback on Resolved Complaint
    fb_res = client.post(f'/api/client/complaints/{cid}/feedback', headers={'Authorization': f'Bearer {citizen_token}'}, json={
        "rating": 5,
        "comment": "Very rapid resolution by the municipal team. Clean water restored!"
    })
    assert fb_res.status_code == 201
    assert fb_res.json["rating"] == 5

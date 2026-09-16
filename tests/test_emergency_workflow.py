import pytest
from bson import ObjectId

def test_emergency_command_center_workflow(client, mongo_db, super_admin_token, client_user_token):
    admin_token, admin_id = super_admin_token
    citizen_token, citizen_id = client_user_token

    # Seed an emergency responder service
    mongo_db.emergency_services.insert_one({
        "service_id": "EMS-HYD-AMB-01",
        "service_type": "AMBULANCE",
        "organization_name": "Apollo Emergency Response Unit",
        "phone": "+91-40-1066",
        "email": "er.apollo@civicai.gov",
        "address": "Jubilee Hills, Hyderabad",
        "location": {
            "type": "Point",
            "coordinates": [78.4110, 17.4320]
        },
        "service_area": "Central Hyderabad",
        "active": True
    })

    # 1. Citizen submits critical emergency complaint
    sub_res = client.post('/api/client/complaints', headers={'Authorization': f'Bearer {citizen_token}'}, json={
        "title": "Commercial warehouse fire with workers trapped",
        "description": "Major building fire raging on 3rd floor with people trapped inside LPG cylinder warehouse sparking heavy smoke.",
        "input_method": "TEXT",
        "address": "Jubilee Hills Road 36, Hyderabad",
        "latitude": 17.4300,
        "longitude": 78.4100
    })
    assert sub_res.status_code == 201
    cid = sub_res.json["complaint_id"]
    assert sub_res.json["severity"] == "CRITICAL"
    assert sub_res.json["emergency_status"] in ["DETECTED", "ADMIN_REVIEW"]

    # 2. Query emergency incidents list
    inc_res = client.get('/api/admin/emergency', headers={'Authorization': f'Bearer {admin_token}'})
    assert inc_res.status_code == 200
    inc_ids = [item.get("complaint_id") for item in inc_res.json["incidents"]]
    assert cid in inc_ids

    # 3. Query incident details with nearest emergency responders
    det_res = client.get(f'/api/admin/emergency/{cid}', headers={'Authorization': f'Bearer {admin_token}'})
    assert det_res.status_code == 200
    nearest = det_res.json["nearest_services"]
    assert len(nearest) > 0
    # First responder should have distance calculated in km
    assert "distance_km" in nearest[0]

    # 4. Declare Emergency
    dec_res = client.post(f'/api/admin/emergency/{cid}/declare', headers={'Authorization': f'Bearer {admin_token}'}, json={
        "notes": "Fire confirmed by satellite/camera. Multi-agency response declared."
    })
    assert dec_res.status_code == 200
    assert dec_res.json["emergency_status"] == "EMERGENCY_DECLARED"

    # 5. Dispatch Emergency Responder (Ambulance)
    dispatch_res = client.post(f'/api/admin/emergency/{cid}/contact-service', headers={'Authorization': f'Bearer {admin_token}'}, json={
        "service_id": "EMS-HYD-AMB-01",
        "service_type": "AMBULANCE",
        "notes": "Dispatch 2 trauma units immediately."
    })
    assert dispatch_res.status_code == 201
    action_id = dispatch_res.json["id"]
    assert dispatch_res.json["status"] == "SERVICE_CONTACTED"

    # 6. Acknowledge Responder
    ack_res = client.post(f'/api/admin/emergency/actions/{action_id}/acknowledge', headers={'Authorization': f'Bearer {admin_token}'}, json={
        "notes": "Ambulance dispatched. ETA 5 minutes."
    })
    assert ack_res.status_code == 200

    # 7. Resolve Emergency
    res_res = client.post(f'/api/admin/emergency/{cid}/resolve', headers={'Authorization': f'Bearer {admin_token}'}, json={
        "notes": "Fire extinguished by first responders. All civilians safely evacuated."
    })
    assert res_res.status_code == 200

    # Verify status in DB
    updated = mongo_db.complaints.find_one({"complaint_id": cid})
    assert updated["emergency_status"] == "EMERGENCY_RESOLVED"

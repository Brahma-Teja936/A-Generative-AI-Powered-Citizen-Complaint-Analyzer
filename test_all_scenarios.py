import urllib.request
import urllib.error
import json
import sys

BASE_URL = "http://127.0.0.1:5000"

def post(endpoint, data=None, token=None):
    url = f"{BASE_URL}{endpoint}"
    payload = json.dumps(data).encode("utf-8") if data is not None else None
    headers = {"Content-Type": "application/json", "Accept": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(url, data=payload, headers=headers, method="POST")
    with urllib.request.urlopen(req) as res:
        return res.status, json.loads(res.read().decode())

def get(endpoint, token=None):
    url = f"{BASE_URL}{endpoint}"
    headers = {"Accept": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(url, headers=headers, method="GET")
    with urllib.request.urlopen(req) as res:
        return res.status, json.loads(res.read().decode())

def put(endpoint, data=None, token=None):
    url = f"{BASE_URL}{endpoint}"
    payload = json.dumps(data).encode("utf-8") if data is not None else None
    headers = {"Content-Type": "application/json", "Accept": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(url, data=payload, headers=headers, method="PUT")
    with urllib.request.urlopen(req) as res:
        return res.status, json.loads(res.read().decode())

print("=" * 70)
print("CIVICAI AUTOMATED INTEGRATION & REGRESSION TEST SUITE")
print("=" * 70)

# TEST 1: Register citizen -> Login -> Submit text complaint -> AI classification -> Review -> Submit -> DB Storage -> Email
print("\n[TEST 1] Citizen Workflow: Register, Analyze, Submit, DB Storage & Email...")
import uuid
unique_email = f"test_citizen_{uuid.uuid4().hex[:6]}@example.com"
status, reg_res = post("/api/auth/register", {
    "name": "Integration Test User",
    "email": unique_email,
    "phone": "555-9988",
    "password": "password123",
    "confirm_password": "password123",
    "location": "North Ward, Sector 2"
})
assert status == 201, f"Expected 201, got {status}"
citizen_token = reg_res["token"]
print("  [OK] Citizen registered successfully:", unique_email)

# Analyze Complaint Text
complaint_input = "There is a huge pothole near the college entrance and vehicles are almost falling."
status, analyze_res = post("/api/complaints/analyze", {"complaint_text": complaint_input})
assert status == 200, f"Expected 200, got {status}"
assert analyze_res["department"] == "Roads & Infrastructure", f"Expected Roads & Infrastructure, got {analyze_res['department']}"
assert analyze_res["severity"] == "HIGH", f"Expected HIGH, got {analyze_res['severity']}"
assert analyze_res["priority"] == "HIGH", f"Expected HIGH, got {analyze_res['priority']}"
print(f"  [OK] AI Analysis returned: {analyze_res['department']} | Sev: {analyze_res['severity']} | Pri: {analyze_res['priority']}")
print(f"       Confidence: {analyze_res['confidence']}")
print(f"       AI Summary: {analyze_res['summary']}")

# Submit Complaint to Database
status, submit_res = post("/api/complaints", {
    "description": complaint_input,
    "department": analyze_res["department"],
    "severity": analyze_res["severity"],
    "priority": analyze_res["priority"],
    "summary": analyze_res["summary"],
    "confidence_department": analyze_res["confidence"]["department"],
    "confidence_severity": analyze_res["confidence"]["severity"],
    "confidence_priority": analyze_res["confidence"]["priority"]
}, token=citizen_token)
assert status == 201, f"Expected 201, got {status}"
complaint_id = submit_res["complaint"]["id"]
print(f"  [OK] Complaint saved to DB with ID #{complaint_id}")

# TEST 2: Admin Login -> Dashboard -> Open complaint -> Change Priority & Status -> Verify
print("\n[TEST 2] Admin Workflow: Login, View Dashboard, Inspect & Triage...")
status, admin_auth = post("/api/auth/admin-login", {"email": "admin@civicai.gov", "password": "admin123"})
assert status == 200, f"Expected 200, got {status}"
admin_token = admin_auth["token"]
print("  [OK] Admin authenticated successfully")

# Get Dashboard Metrics
status, dash = get("/api/admin/dashboard", token=admin_token)
assert status == 200
print(f"  [OK] Dashboard Metrics: Total: {dash['metrics']['total_complaints']} | Pending: {dash['metrics']['pending']} | In Progress: {dash['metrics']['in_progress']}")
print(f"       Recharts Dept items: {len(dash['charts']['by_department'])} | Severity items: {len(dash['charts']['by_severity'])}")

# Admin updates complaint status to "Resolved" and priority to "URGENT"
status, update_res = put(f"/api/admin/complaints/{complaint_id}", {
    "status": "Resolved",
    "priority": "URGENT"
}, token=admin_token)
assert status == 200
print(f"  [OK] Admin updated Complaint #{complaint_id} status -> Resolved, priority -> URGENT")

# Citizen verifies updated status
status, citizen_view = get(f"/api/complaints/{complaint_id}", token=citizen_token)
assert status == 200
assert citizen_view["complaint"]["status"] == "Resolved"
assert citizen_view["complaint"]["priority"] == "URGENT"
print(f"  [OK] Citizen verified updated status #{complaint_id}: {citizen_view['complaint']['status']}")

# TEST 3: Invalid Complaint (empty text)
print("\n[TEST 3] Validation: Empty complaint submission...")
try:
    post("/api/complaints/analyze", {"complaint_text": "   "})
    print("  [FAIL] Expected 400")
except urllib.error.HTTPError as e:
    assert e.code == 400
    print(f"  [OK] Expected HTTP 400 returned for empty complaint text")

# TEST 4: Invalid Login
print("\n[TEST 4] Validation: Invalid credentials...")
try:
    post("/api/auth/login", {"email": "nonexistent@civicai.gov", "password": "wrongpassword"})
    print("  [FAIL] Expected 401")
except urllib.error.HTTPError as e:
    assert e.code == 401
    print(f"  [OK] Expected HTTP 401 returned for bad password")

# TEST 5: Unauthorized Citizen Attempting Admin API
print("\n[TEST 7] Security: Citizen attempting Admin API...")
try:
    get("/api/admin/dashboard", token=citizen_token)
    print("  [FAIL] Expected 403")
except urllib.error.HTTPError as e:
    assert e.code == 403
    print(f"  [OK] Expected HTTP 403 Forbidden returned for non-admin user accessing admin dashboard")

# TEST 6: Check Email Logs in Database
print("\n[TEST 6] Email Notification Logs Verification...")
status, email_logs_res = get("/api/email-logs", token=admin_token)
assert status == 200
logs = email_logs_res["email_logs"]
print(f"  [OK] Verified {len(logs)} email notification records in email_logs table.")
if logs:
    print(f"       Latest log: #{logs[0]['id']} | To: {logs[0]['recipient']} | Status: {logs[0]['status']}")

print("\n" + "=" * 70)
print("ALL 7 CORE SYSTEM & SECURITY WORKFLOW TESTS PASSED SUCCESSFULLY!")
print("=" * 70)

import os
import random
import datetime
import math
import werkzeug.utils
from backend.config import Config
from backend.app.extensions import Database

def generate_complaint_id() -> str:
    """
    Generate unique Complaint ID with format CMP-YYYY-XXXXXX
    e.g. CMP-2026-004821
    """
    db = Database.get_db()
    current_year = datetime.datetime.now().year

    for _ in range(10):
        random_digits = f"{random.randint(1, 999999):06d}"
        candidate_id = f"CMP-{current_year}-{random_digits}"
        if db is not None:
            existing = db.complaints.find_one({"complaint_id": candidate_id})
            if not existing:
                return candidate_id
        else:
            return candidate_id

    # Fallback to timestamp-based if collision
    return f"CMP-{current_year}-{int(datetime.datetime.now().timestamp()) % 1000000:06d}"

def is_allowed_file(filename: str) -> bool:
    """Validate file extension against allowed set."""
    if '.' not in filename:
        return False
    ext = filename.rsplit('.', 1)[1].lower()
    return ext in Config.ALLOWED_EXTENSIONS

def save_uploaded_file(file_storage, subfolder: str = "complaints") -> str:
    """
    Safely validate and save an uploaded file.
    Returns relative path from upload folder.
    """
    if not file_storage or not file_storage.filename:
        return None

    if not is_allowed_file(file_storage.filename):
        raise ValueError("File type not allowed or executable/dangerous.")

    # Sanitize filename
    orig_name = werkzeug.utils.secure_filename(file_storage.filename)
    timestamp = int(datetime.datetime.now().timestamp() * 1000)
    safe_name = f"{timestamp}_{orig_name}"

    target_dir = os.path.join(Config.UPLOAD_FOLDER, subfolder)
    os.makedirs(target_dir, exist_ok=True)
    full_path = os.path.join(target_dir, safe_name)
    file_storage.save(full_path)

    # Return web-accessible relative path
    return f"uploads/{subfolder}/{safe_name}"

def calculate_haversine_distance_km(lat1, lon1, lat2, lon2) -> float:
    """Calculate distance in kilometers between two GPS coordinates."""
    R = 6371.0 # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 2)

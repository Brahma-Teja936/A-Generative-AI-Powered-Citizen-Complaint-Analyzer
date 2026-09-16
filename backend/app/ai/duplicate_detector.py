import datetime
from sklearn.metrics.pairwise import cosine_similarity
from backend.app.extensions import Database
from backend.app.ml.predictor import MLPredictor
from backend.app.utils.helpers import calculate_haversine_distance_km

def check_duplicate_complaints(complaint_text: str, location_coords: list = None, 
                               category: str = None, days_window: int = 30) -> list:
    """
    Identifies potential duplicate complaints using:
    1. TF-IDF cosine similarity of complaint text
    2. Spatial proximity (Haversine distance <= 1.0 km)
    3. Category match
    4. Time window (recent complaints within days_window)
    
    CRITICAL: Only compares against LIVE complaints (is_training_data: False).
    Returns list of candidate duplicate items sorted by similarity score.
    """
    db = Database.get_db()
    if db is None:
        return []

    predictor = MLPredictor.get_instance()
    if not predictor.tfidf:
        return []

    # Calculate TF-IDF vector of new complaint
    try:
        new_vec = predictor.tfidf.transform([complaint_text.lower()])
    except Exception:
        return []

    cutoff_date = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=days_window)

    # STRICT ISOLATION: LIVE records only!
    query = {
        "is_training_data": False,
        "record_type": "LIVE",
        "status": {"$in": ["SUBMITTED", "UNDER_REVIEW", "ASSIGNED", "ACCEPTED", "IN_PROGRESS", "ON_HOLD"]},
        "created_at": {"$gte": cutoff_date}
    }

    candidates = list(db.complaints.find(query, {
        "complaint_id": 1,
        "title": 1,
        "original_text": 1,
        "translated_text_en": 1,
        "category": 1,
        "department": 1,
        "location": 1,
        "created_at": 1
    }).limit(100))

    if not candidates:
        return []

    candidate_texts = [c.get("translated_text_en") or c.get("original_text") or c.get("title", "") for c in candidates]
    candidate_vecs = predictor.tfidf.transform([t.lower() for t in candidate_texts])

    similarities = cosine_similarity(new_vec, candidate_vecs)[0]

    duplicates = []
    for idx, cand in enumerate(candidates):
        text_sim = float(similarities[idx])
        
        # Location proximity bonus
        loc_match = False
        distance_km = None
        cand_loc = cand.get("location", {})
        cand_coords = cand_loc.get("coordinates") if isinstance(cand_loc, dict) else None

        if location_coords and cand_coords and len(location_coords) == 2 and len(cand_coords) == 2:
            try:
                # Leaflet / GeoJSON: [lng, lat]
                lon1, lat1 = location_coords
                lon2, lat2 = cand_coords
                distance_km = calculate_haversine_distance_km(lat1, lon1, lat2, lon2)
                if distance_km <= 1.0: # Within 1 km
                    loc_match = True
            except Exception:
                pass

        # Composite score
        composite_score = text_sim * 0.7
        if loc_match:
            composite_score += 0.2
        if category and cand.get("category") == category:
            composite_score += 0.1

        composite_score = min(round(composite_score, 4), 1.0)

        # Threshold for showing as possible duplicate: 0.55
        if composite_score >= 0.55:
            duplicates.append({
                "complaint_id": cand.get("complaint_id"),
                "title": cand.get("title"),
                "department": cand.get("department"),
                "category": cand.get("category"),
                "location_name": cand.get("location", {}).get("address") if isinstance(cand.get("location"), dict) else "N/A",
                "distance_km": distance_km,
                "similarity_score": composite_score,
                "date": cand.get("created_at").isoformat() if isinstance(cand.get("created_at"), datetime.datetime) else str(cand.get("created_at"))
            })

    duplicates.sort(key=lambda x: x["similarity_score"], reverse=True)
    return duplicates[:5]

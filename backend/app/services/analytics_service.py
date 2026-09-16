from backend.app.extensions import Database

class AnalyticsService:
    @staticmethod
    def get_dashboard_summary():
        """
        Retrieves top-level KPIs strictly filtering out training data.
        """
        db = Database.get_db()
        if db is None:
            return {
                "total": 0, "pending": 0, "under_review": 0, "assigned": 0,
                "in_progress": 0, "high_priority": 0, "critical": 0, "resolved": 0
            }

        live_base = {"is_training_data": False, "record_type": "LIVE"}

        total = db.complaints.count_documents(live_base)
        pending = db.complaints.count_documents({**live_base, "status": "SUBMITTED"})
        under_review = db.complaints.count_documents({**live_base, "status": "UNDER_REVIEW"})
        assigned = db.complaints.count_documents({**live_base, "status": "ASSIGNED"})
        in_progress = db.complaints.count_documents({**live_base, "status": {"$in": ["ACCEPTED", "IN_PROGRESS"]}})
        high_priority = db.complaints.count_documents({**live_base, "priority": {"$in": ["HIGH", "VERY HIGH", "CRITICAL"]}})
        critical = db.complaints.count_documents({**live_base, "severity": "CRITICAL"})
        resolved = db.complaints.count_documents({**live_base, "status": {"$in": ["RESOLVED", "CLOSED"]}})

        resolution_rate = round((resolved / total * 100) if total > 0 else 0, 1)

        return {
            "total": total,
            "pending": pending,
            "under_review": under_review,
            "assigned": assigned,
            "in_progress": in_progress,
            "high_priority": high_priority,
            "critical": critical,
            "resolved": resolved,
            "resolution_rate": resolution_rate
        }

    @staticmethod
    def get_breakdowns():
        """
        Aggregates distribution metrics using MongoDB pipelines, strictly excluding training records.
        """
        db = Database.get_db()
        if db is None:
            return {}

        match_live = {"$match": {"is_training_data": False, "record_type": "LIVE"}}

        def aggregate_field(field_name):
            pipeline = [
                match_live,
                {"$group": {"_id": f"${field_name}", "count": {"$sum": 1}}},
                {"$sort": {"count": -1}}
            ]
            results = list(db.complaints.aggregate(pipeline))
            return [{"name": (r["_id"] or "Unclassified"), "value": r["count"]} for r in results]

        by_department = aggregate_field("department")
        by_category = aggregate_field("category")
        by_severity = aggregate_field("severity")
        by_priority = aggregate_field("priority")
        by_urgency = aggregate_field("urgency")
        by_status = aggregate_field("status")

        # Department performance (resolved vs active)
        dept_pipeline = [
            match_live,
            {
                "$group": {
                    "_id": "$department",
                    "total": {"$sum": 1},
                    "resolved": {"$sum": {"$cond": [{"$in": ["$status", ["RESOLVED", "CLOSED"]]}, 1, 0]}},
                    "active": {"$sum": {"$cond": [{"$in": ["$status", ["ASSIGNED", "ACCEPTED", "IN_PROGRESS"]]}, 1, 0]}}
                }
            },
            {"$sort": {"total": -1}}
        ]
        dept_performance = list(db.complaints.aggregate(dept_pipeline))
        formatted_dept_perf = [
            {
                "department": d["_id"] or "Unassigned",
                "total": d["total"],
                "resolved": d["resolved"],
                "active": d["active"],
                "resolution_pct": round((d["resolved"] / d["total"] * 100) if d["total"] > 0 else 0, 1)
            }
            for d in dept_performance
        ]

        # Location hotspots
        hotspot_pipeline = [
            match_live,
            {"$group": {"_id": "$location.area", "count": {"$sum": 1}, "city": {"$first": "$location.city"}}},
            {"$sort": {"count": -1}},
            {"$limit": 10}
        ]
        hotspots = list(db.complaints.aggregate(hotspot_pipeline))
        formatted_hotspots = [
            {"area": h["_id"] or "Central Zone", "city": h.get("city", ""), "complaints": h["count"]}
            for h in hotspots
        ]

        return {
            "by_department": by_department,
            "by_category": by_category,
            "by_severity": by_severity,
            "by_priority": by_priority,
            "by_urgency": by_urgency,
            "by_status": by_status,
            "department_performance": formatted_dept_perf,
            "location_hotspots": formatted_hotspots
        }

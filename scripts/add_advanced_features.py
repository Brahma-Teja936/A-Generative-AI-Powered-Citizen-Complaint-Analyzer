import pandas as pd
import random
from pathlib import Path

# ==========================================================
# Project Paths
# ==========================================================

BASE_DIR = Path(__file__).resolve().parent.parent

input_file = BASE_DIR / "dataset" / "final" / "APCCD_2026.csv"
output_file = BASE_DIR / "dataset" / "final" / "APCCD_2026.csv"

# ==========================================================
# Load Dataset
# ==========================================================

print("=" * 60)
print("Loading APCCD_2026.csv...")
print("=" * 60)

df = pd.read_csv(input_file)

print("Dataset Loaded Successfully!")
print("Dataset Shape:", df.shape)

# ==========================================================
# Resolution Status
# ==========================================================

resolution_status = [
    "Pending",
    "In Progress",
    "Resolved"
]

weights = [0.30, 0.40, 0.30]

df["Resolution_Status"] = random.choices(
    resolution_status,
    weights=weights,
    k=len(df)
)

print("Resolution_Status Added")

# ==========================================================
# SLA Days
# ==========================================================

sla_mapping = {
    "Critical": 2,
    "High": 5,
    "Medium": 7,
    "Low": 10
}

df["SLA_Days"] = df["Severity"].map(sla_mapping)

print("SLA_Days Added")

# ==========================================================
# Complaint Channel
# ==========================================================

channels = [
    "Mobile App",
    "Citizen Portal",
    "WhatsApp",
    "Call Center",
    "Email"
]

weights = [0.35, 0.25, 0.15, 0.15, 0.10]

df["Complaint_Channel"] = random.choices(
    channels,
    weights=weights,
    k=len(df)
)

print("Complaint_Channel Added")

# ==========================================================
# Complaint Language
# ==========================================================

languages = [
    "English",
    "Telugu"
]

weights = [0.70, 0.30]

df["Complaint_Language"] = random.choices(
    languages,
    weights=weights,
    k=len(df)
)

print("Complaint_Language Added")

# ==========================================================
# Citizen Type
# ==========================================================

citizen_types = [
    "Resident",
    "Business",
    "Visitor"
]

weights = [0.80, 0.15, 0.05]

df["Citizen_Type"] = random.choices(
    citizen_types,
    weights=weights,
    k=len(df)
)

print("Citizen_Type Added")

# ==========================================================
# AI Confidence
# ==========================================================

df["AI_Confidence"] = [
    round(random.uniform(0.85, 0.99), 2)
    for _ in range(len(df))
]

print("AI_Confidence Added")

# ==========================================================
# Geo Zone
# ==========================================================

zones = [
    "North",
    "South",
    "East",
    "West",
    "Central"
]

df["Geo_Zone"] = random.choices(
    zones,
    k=len(df)
)

print("Geo_Zone Added")

# ==========================================================
# Ward
# ==========================================================

df["Ward"] = [
    f"Ward-{random.randint(1,50):02d}"
    for _ in range(len(df))
]

print("Ward Added")

# ==========================================================
# PinCode
# ==========================================================

df["PinCode"] = [
    random.randint(500001,500200)
    for _ in range(len(df))
]

print("PinCode Added")

# ==========================================================
# Save Dataset
# ==========================================================

df.to_csv(output_file,index=False)

# ==========================================================
# Final Output
# ==========================================================

print("\n" + "="*60)
print("Advanced Features Added Successfully!")
print("="*60)

print("\nDataset Shape:")
print(df.shape)

print("\nNew Columns Added:")

new_columns = [
    "Resolution_Status",
    "SLA_Days",
    "Complaint_Channel",
    "Complaint_Language",
    "Citizen_Type",
    "AI_Confidence",
    "Geo_Zone",
    "Ward",
    "PinCode"
]

for col in new_columns:
    print("✓", col)

print("\nSample Records:\n")

print(
    df[
        [
            "Complaint_ID",
            "APCCD_Category",
            "Priority",
            "Severity",
            "Resolution_Status",
            "SLA_Days",
            "Complaint_Channel",
            "Complaint_Language",
            "Citizen_Type",
            "AI_Confidence",
            "Geo_Zone",
            "Ward",
            "PinCode"
        ]
    ].head(10)
)

print("\nSaved File:")
print(output_file)

print("\nDone.")
import pandas as pd
from pathlib import Path

# ==========================================================
# Project Paths
# ==========================================================

BASE_DIR = Path(__file__).resolve().parent.parent

input_file = BASE_DIR / "dataset" / "processed" / "NYC311_Clean.csv"
output_file = BASE_DIR / "dataset" / "final" / "APCCD_2026.csv"

print("=" * 60)
print("Loading NYC311_Clean.csv...")
print("=" * 60)

df = pd.read_csv(input_file)

print("Dataset Loaded Successfully!")
print("Dataset Shape :", df.shape)

# ==========================================================
# Complaint ID
# ==========================================================

df.insert(
    0,
    "Complaint_ID",
    ["AP2026{:06d}".format(i) for i in range(1, len(df) + 1)]
)

print("Complaint_ID Added")

# ==========================================================
# Priority Mapping
# ==========================================================

priority_mapping = {
    "Roads": "Medium",
    "Street Lights": "Medium",
    "Water Supply": "High",
    "Sewer & Drainage": "High",
    "Sanitation": "Medium",
    "Parks & Trees": "Low",
    "Building Maintenance": "Medium",
    "Public Health": "High",
    "Noise Pollution": "Low",
    "Traffic & Parking": "Medium",
    "Encroachment": "Medium",
    "Public Property": "Low",
    "Animal Welfare": "Medium",
    "Food Safety": "High",
    "Public Safety": "High"
}

df["Priority"] = df["APCCD_Category"].map(priority_mapping)

# ==========================================================
# Severity Mapping
# ==========================================================

severity_mapping = {
    "Roads": "High",
    "Street Lights": "Medium",
    "Water Supply": "Critical",
    "Sewer & Drainage": "Critical",
    "Sanitation": "Medium",
    "Parks & Trees": "Low",
    "Building Maintenance": "Medium",
    "Public Health": "High",
    "Noise Pollution": "Low",
    "Traffic & Parking": "Medium",
    "Encroachment": "Medium",
    "Public Property": "Low",
    "Animal Welfare": "Medium",
    "Food Safety": "High",
    "Public Safety": "Critical"
}

df["Severity"] = df["APCCD_Category"].map(severity_mapping)

print("Priority Added")
print("Severity Added")

# ==========================================================
# Save
# ==========================================================

df.to_csv(output_file, index=False)

print("\n" + "=" * 60)
print("APCCD_2026.csv Restored Successfully!")
print("=" * 60)

print("\nFinal Shape :", df.shape)

print("\nColumns\n")
print(df.columns.tolist())
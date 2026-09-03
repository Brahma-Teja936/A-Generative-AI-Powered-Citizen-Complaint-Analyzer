import pandas as pd
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
# Complaint ID
# ==========================================================

if "Complaint_ID" not in df.columns:

    print("\nGenerating Complaint IDs...")

    df.insert(
        0,
        "Complaint_ID",
        [
            f"AP2026{str(i + 1).zfill(6)}"
            for i in range(len(df))
        ]
    )

    print("Complaint_ID Added Successfully!")

else:

    print("\nComplaint_ID already exists.")

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

if "Priority" not in df.columns:

    print("\nAdding Priority...")

    df["Priority"] = df["APCCD_Category"].map(priority_mapping)

    print("Priority Added Successfully!")

else:

    print("\nPriority already exists.")

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

if "Severity" not in df.columns:

    print("\nAdding Severity...")

    df["Severity"] = df["APCCD_Category"].map(severity_mapping)

    print("Severity Added Successfully!")

else:

    print("\nSeverity already exists.")

# ==========================================================
# Check Missing Values
# ==========================================================

print("\nMissing Values")

print("Complaint_ID :", df["Complaint_ID"].isna().sum())
print("Priority    :", df["Priority"].isna().sum())
print("Severity    :", df["Severity"].isna().sum())

# ==========================================================
# Save Dataset
# ==========================================================

df.to_csv(output_file, index=False)

# ==========================================================
# Final Output
# ==========================================================

print("\n" + "=" * 60)
print("Basic Features Added Successfully!")
print("=" * 60)

print("\nSaved File:")
print(output_file)

print("\nFinal Dataset Shape:")
print(df.shape)

print("\nColumns:")

for column in df.columns:
    print(column)

print("\nSample Records:\n")

print(
    df[
        [
            "Complaint_ID",
            "APCCD_Category",
            "Priority",
            "Severity"
        ]
    ].head(10)
)

print("\nDone.")
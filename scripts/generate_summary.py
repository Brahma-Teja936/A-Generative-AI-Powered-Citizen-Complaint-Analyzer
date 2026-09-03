import pandas as pd
from pathlib import Path

# ==========================================================
# Project Paths
# ==========================================================

BASE_DIR = Path(__file__).resolve().parent.parent

input_file = BASE_DIR / "dataset" / "final" / "APCCD_2026.csv"

# ==========================================================
# Load Dataset
# ==========================================================

print("=" * 60)
print("Loading APCCD_2026.csv...")
print("=" * 60)

df = pd.read_csv(input_file)

print("Dataset Loaded Successfully!")
print("Dataset Shape :", df.shape)

# ==========================================================
# Complaint Summary Mapping
# ==========================================================

summary_mapping = {

    "Roads":
        "Road damage or pothole reported.",

    "Water Supply":
        "Water supply issue reported.",

    "Sanitation":
        "Garbage collection or sanitation issue reported.",

    "Street Lights":
        "Street light malfunction reported.",

    "Noise Pollution":
        "Noise disturbance complaint reported.",

    "Building Maintenance":
        "Building maintenance issue reported.",

    "Traffic & Parking":
        "Traffic or illegal parking complaint reported.",

    "Parks & Trees":
        "Park or tree maintenance issue reported.",

    "Public Health":
        "Public health concern reported.",

    "Public Safety":
        "Public safety issue reported.",

    "Sewer & Drainage":
        "Drainage or sewer problem reported.",

    "Encroachment":
        "Illegal encroachment reported.",

    "Animal Welfare":
        "Animal welfare complaint reported.",

    "Public Property":
        "Damage to public property reported.",

    "Food Safety":
        "Food safety complaint reported."

}

# ==========================================================
# Create Complaint Summary
# ==========================================================

print("\nGenerating Complaint Summary...")

df["Complaint_Summary"] = df["APCCD_Category"].map(summary_mapping)

# Fill missing summaries

df["Complaint_Summary"] = df["Complaint_Summary"].fillna(
    "General civic complaint reported."
)

print("Complaint Summary Generated Successfully!")

# ==========================================================
# Save Dataset
# ==========================================================

df.to_csv(input_file, index=False)

# ==========================================================
# Display Sample
# ==========================================================

print("\nSample Output:\n")

print(
    df[
        [
            "Complaint_Type",
            "APCCD_Category",
            "Complaint_Summary"
        ]
    ].head(20)
)

print("\nMissing Summaries :", df["Complaint_Summary"].isnull().sum())

print("\n" + "=" * 60)
print("Complaint Summary Added Successfully!")
print("=" * 60)

print("\nSaved File:")
print(input_file)

print("\nFinal Dataset Shape :", df.shape)

print("\nColumns in Dataset:\n")
print(df.columns.tolist())
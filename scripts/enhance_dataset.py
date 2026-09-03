import pandas as pd
import random
from pathlib import Path

from complaint_templates import templates
from feature_mappings import (
    SUMMARY_MAPPING,
    SENTIMENT_MAPPING,
    URGENCY_MAPPING,
    RESOLUTION_DAYS_MAPPING,
    EMERGENCY_MAPPING,
    COMPLAINT_SOURCE
)

# ==========================================================
# Project Paths
# ==========================================================

BASE_DIR = Path(__file__).resolve().parent.parent

input_file = BASE_DIR / "dataset" / "final" / "APCCD_2026.csv"
output_file = BASE_DIR / "dataset" / "final" / "APCCD_2026.csv"

# ==========================================================
# Read Dataset
# ==========================================================

print("=" * 60)
print("Loading APCCD_2026.csv...")
print("=" * 60)

df = pd.read_csv(input_file)

print("Dataset Loaded Successfully!")
print("Dataset Shape:", df.shape)

# ==========================================================
# Complaint Text Generator
# ==========================================================

def generate_complaint_text(row):

    category = str(row["APCCD_Category"])

    descriptor = str(row["descriptor"]).strip().lower()

    city = str(row["city"]).title()

    default_templates = [
        "A complaint has been reported regarding {descriptor}.",
        "Residents are facing inconvenience because of {descriptor}.",
        "Immediate attention is required regarding {descriptor}.",
        "Please investigate the issue related to {descriptor}.",
        "Kindly resolve the reported complaint."
    ]

    selected_templates = templates.get(category, default_templates)

    template = random.choice(selected_templates)

    return template.format(
        descriptor=descriptor,
        city=city
    )

# ==========================================================
# Generate Complaint Text
# ==========================================================

print("\nGenerating Complaint Text...")

df["Complaint_Text"] = df.apply(generate_complaint_text, axis=1)

print("Complaint Text Generated Successfully!")

# ==========================================================
# Generate Complaint Summary
# ==========================================================

print("\nGenerating Complaint Summary...")

df["Complaint_Summary"] = df["APCCD_Category"].map(
    SUMMARY_MAPPING
)

print("Complaint Summary Generated Successfully!")

# ==========================================================
# Generate Sentiment
# ==========================================================

print("\nGenerating Sentiment...")

df["Sentiment"] = df["APCCD_Category"].map(
    SENTIMENT_MAPPING
)

print("Sentiment Generated Successfully!")

# ==========================================================
# Generate Urgency Score
# ==========================================================

print("\nGenerating Urgency Score...")

df["Urgency_Score"] = df["APCCD_Category"].map(
    URGENCY_MAPPING
)

print("Urgency Score Generated Successfully!")
# ==========================================================
# Generate Estimated Resolution Days
# ==========================================================

print("\nGenerating Estimated Resolution Days...")

df["Estimated_Resolution_Days"] = df["APCCD_Category"].map(
    RESOLUTION_DAYS_MAPPING
)

print("Estimated Resolution Days Generated Successfully!")

# ==========================================================
# Generate Complaint Length
# ==========================================================

print("\nGenerating Complaint Length...")

df["Complaint_Length"] = (
    df["Complaint_Text"]
    .fillna("")
    .apply(lambda x: len(str(x).split()))
)

print("Complaint Length Generated Successfully!")

# ==========================================================
# Convert Date Column
# ==========================================================

print("\nProcessing Date Information...")

df["created_date"] = pd.to_datetime(
    df["created_date"],
    errors="coerce"
)

# ==========================================================
# Generate Month
# ==========================================================

df["Month"] = df["created_date"].dt.month_name()

# ==========================================================
# Generate Day of Week
# ==========================================================

df["Day_of_Week"] = df["created_date"].dt.day_name()

# ==========================================================
# Generate Hour
# ==========================================================

df["Hour"] = df["created_date"].dt.hour

print("Date Features Generated Successfully!")

# ==========================================================
# Generate Emergency Flag
# ==========================================================

print("\nGenerating Emergency Flag...")

df["Is_Emergency"] = df["APCCD_Category"].map(
    EMERGENCY_MAPPING
)

print("Emergency Flag Generated Successfully!")

# ==========================================================
# Generate Complaint Source
# ==========================================================

print("\nGenerating Complaint Source...")

df["Complaint_Source"] = [
    random.choice(COMPLAINT_SOURCE)
    for _ in range(len(df))
]

print("Complaint Source Generated Successfully!")
# ==========================================================
# Check Missing Values
# ==========================================================

print("\nChecking Missing Values...\n")

columns_to_check = [
    "Complaint_Text",
    "Complaint_Summary",
    "Sentiment",
    "Urgency_Score",
    "Estimated_Resolution_Days",
    "Complaint_Length",
    "Month",
    "Day_of_Week",
    "Hour",
    "Is_Emergency",
    "Complaint_Source"
]

for col in columns_to_check:
    print(f"{col} : {df[col].isna().sum()}")

# ==========================================================
# Save Dataset
# ==========================================================

df.to_csv(output_file, index=False)

# ==========================================================
# Display Sample Records
# ==========================================================

print("\n" + "=" * 70)
print("Sample Records")
print("=" * 70)

print(
    print(df.head(15))
)

# ==========================================================
# Category Distribution
# ==========================================================

print("\n" + "=" * 70)
print("Complaint Category Distribution")
print("=" * 70)

print(df["APCCD_Category"].value_counts())

# ==========================================================
# Sentiment Distribution
# ==========================================================

print("\n" + "=" * 70)
print("Sentiment Distribution")
print("=" * 70)

print(df["Sentiment"].value_counts())

# ==========================================================
# Emergency Distribution
# ==========================================================

print("\n" + "=" * 70)
print("Emergency Complaint Distribution")
print("=" * 70)

print(df["Is_Emergency"].value_counts())

# ==========================================================
# Final Information
# ==========================================================
print("=" * 60)
print("Loading APCCD_2026.csv...")
print("=" * 60)

df = pd.read_csv(input_file)

# ADD THESE TWO LINES HERE
print("\nColumns in Dataset:")
print(df.columns.tolist())

print("Dataset Loaded Successfully!")
print("Dataset Shape:", df.shape)

print("\n" + "=" * 70)
print("APCCD_2026.csv Enhanced Successfully!")
print("=" * 70)

print("\nSaved File:")
print(output_file)

print("\nFinal Dataset Shape:")
print(df.shape)

print("\nColumns:")

for column in df.columns:
    print(column)

print("\nDone.")
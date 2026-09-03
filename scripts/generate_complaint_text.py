import pandas as pd
import random
from pathlib import Path

# Import templates
from complaint_templates import templates

# ==========================================================
# Project Paths
# ==========================================================

BASE_DIR = Path(__file__).resolve().parent.parent

input_file = BASE_DIR / "dataset" / "processed" / "NYC311_Clean.csv"
output_file = BASE_DIR / "dataset" / "final" / "APCCD_2026.csv"

# ==========================================================
# Read Dataset
# ==========================================================

print("=" * 60)
print("Loading Dataset...")
print("=" * 60)

df = pd.read_csv(input_file)

print("Dataset Loaded Successfully!")
print("Dataset Shape :", df.shape)

# ==========================================================
# Complaint Generator
# ==========================================================

def generate_text(row):

    # -----------------------------
    # Read Values Safely
    # -----------------------------

    category = str(row.get("APCCD_Category", "")).strip()

    descriptor = row.get("descriptor", "")

    city = row.get("city", "")

    # Handle Missing Descriptor

    if pd.isna(descriptor):
        descriptor = "the reported issue"

    descriptor = str(descriptor).lower()

    # Handle Missing City

    if pd.isna(city):
        city = "the locality"

    city = str(city).title()

    # -----------------------------
    # Default Templates
    # -----------------------------

    default_templates = [

        "Residents have reported {descriptor}.",

        "Immediate attention is required regarding {descriptor}.",

        "Please investigate the issue related to {descriptor}.",

        "The complaint concerns {descriptor}.",

        "Kindly resolve this issue as soon as possible."

    ]

    # -----------------------------
    # Get Templates
    # -----------------------------

    selected_templates = templates.get(category, default_templates)

    # -----------------------------
    # Choose Random Template
    # -----------------------------

    template = random.choice(selected_templates)

    # -----------------------------
    # Replace Variables
    # -----------------------------

    complaint = template.format(

        descriptor=descriptor,

        city=city

    )

    return complaint

# ==========================================================
# Generate Complaint Text
# ==========================================================

print("\nGenerating Complaint Text...")

df["Complaint_Text"] = df.apply(generate_text, axis=1)

print("Complaint Text Generated Successfully!")

# ==========================================================
# Save Dataset
# ==========================================================

df.to_csv(output_file, index=False)

print("\n" + "=" * 60)
print("APCCD_2026.csv Saved Successfully!")
print("=" * 60)

print("\nSaved Location:")
print(output_file)

# ==========================================================
# Show Sample
# ==========================================================

print("\nSample Complaints\n")

print(

    df[
        [
            "Complaint_Type",
            "APCCD_Category",
            "Complaint_Text"
        ]
    ].head(20)

)

print("\nTotal Records :", len(df))

print("\nDone.")
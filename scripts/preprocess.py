import pandas as pd
from pathlib import Path

# ==========================================================
# Project Paths
# ==========================================================

BASE_DIR = Path(__file__).resolve().parent.parent

input_file = BASE_DIR / "dataset" / "final" / "APCCD_2026.csv"
output_file = BASE_DIR / "dataset" / "final" / "APCCD_2026_Preprocessed.csv"

# ==========================================================
# Load Dataset
# ==========================================================

print("=" * 60)
print("Loading APCCD_2026.csv...")
print("=" * 60)

df = pd.read_csv(input_file)

print("Dataset Loaded Successfully!")
print("Shape :", df.shape)

# ==========================================================
# Remove Duplicate Rows
# ==========================================================

duplicates = df.duplicated().sum()

print("\nDuplicate Rows Found :", duplicates)

df = df.drop_duplicates()

print("Duplicates Removed Successfully!")

# ==========================================================
# Missing Values
# ==========================================================

print("\nChecking Missing Values...\n")

print(df.isnull().sum())

# ==========================================================
# Fill Missing Values
# ==========================================================

for column in df.columns:

    if df[column].dtype == "object":

        df[column] = df[column].fillna("Unknown")

    else:

        df[column] = df[column].fillna(0)

print("\nMissing Values Filled!")

# ==========================================================
# Clean Complaint Text
# ==========================================================

if "Complaint_Text" in df.columns:

    df["Complaint_Text"] = (

        df["Complaint_Text"]

        .astype(str)

        .str.strip()

        .str.replace(r"\s+", " ", regex=True)

    )

print("Complaint_Text Cleaned!")

# ==========================================================
# Convert Date
# ==========================================================

if "created_date" in df.columns:

    df["created_date"] = pd.to_datetime(

        df["created_date"],

        errors="coerce"

    )

print("Date Converted Successfully!")

# ==========================================================
# Final Missing Check
# ==========================================================

print("\nRemaining Missing Values\n")

print(df.isnull().sum())

# ==========================================================
# Save Dataset
# ==========================================================

df.to_csv(output_file, index=False)

# ==========================================================
# Final Report
# ==========================================================

print("\n" + "=" * 60)

print("Dataset Preprocessed Successfully!")

print("=" * 60)

print("\nSaved File:")

print(output_file)

print("\nFinal Shape:")

print(df.shape)

print("\nColumns:")

for col in df.columns:

    print(col)

print("\nDone.")
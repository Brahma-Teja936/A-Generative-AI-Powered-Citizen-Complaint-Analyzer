import pandas as pd
from pathlib import Path

# ==========================================================
# Project Paths
# ==========================================================

BASE_DIR = Path(__file__).resolve().parent.parent

train_file = BASE_DIR / "dataset" / "train" / "train.csv"
validation_file = BASE_DIR / "dataset" / "validation" / "validation.csv"

# ==========================================================
# Load datasets
# ==========================================================

print("=" * 60)
print("DATA LEAKAGE / DUPLICATE CHECK")
print("=" * 60)

train_df = pd.read_csv(train_file)
valid_df = pd.read_csv(validation_file)

print("\nTraining rows   :", len(train_df))
print("Validation rows :", len(valid_df))

# ==========================================================
# Check required column
# ==========================================================

column = "Complaint_Text"

if column not in train_df.columns or column not in valid_df.columns:
    print(f"\nERROR: '{column}' column not found.")
    print("Training columns:")
    print(train_df.columns.tolist())
    exit()

# ==========================================================
# Clean complaint text
# ==========================================================

train_text = (
    train_df[column]
    .fillna("")
    .astype(str)
    .str.strip()
    .str.lower()
)

valid_text = (
    valid_df[column]
    .fillna("")
    .astype(str)
    .str.strip()
    .str.lower()
)

# ==========================================================
# Duplicate complaints inside each dataset
# ==========================================================

train_duplicates = train_text.duplicated().sum()
valid_duplicates = valid_text.duplicated().sum()

print("\n" + "=" * 60)
print("DUPLICATES INSIDE EACH DATASET")
print("=" * 60)

print("\nDuplicate complaints in training   :", train_duplicates)
print("Duplicate complaints in validation :", valid_duplicates)

# ==========================================================
# Exact duplicates between train and validation
# ==========================================================

train_unique = set(train_text)
valid_unique = set(valid_text)

overlap = train_unique.intersection(valid_unique)

print("\n" + "=" * 60)
print("TRAIN ↔ VALIDATION OVERLAP")
print("=" * 60)

print("\nUnique training complaints   :", len(train_unique))
print("Unique validation complaints :", len(valid_unique))

print("\nExact complaints appearing in BOTH datasets:", len(overlap))

# ==========================================================
# Display examples
# ==========================================================

if len(overlap) > 0:

    print("\n" + "=" * 60)
    print("EXAMPLES OF OVERLAPPING COMPLAINTS")
    print("=" * 60)

    for i, text in enumerate(list(overlap)[:10], start=1):

        print(f"\n{i}. {text}")

else:

    print("\n✓ No exact complaint overlap found.")

# ==========================================================
# Summary
# ==========================================================

print("\n" + "=" * 60)
print("SUMMARY")
print("=" * 60)

if len(overlap) == 0:

    print("\n✓ No exact duplicates between training and validation.")

else:

    print(
        f"\n⚠ WARNING: {len(overlap)} exact complaints "
        "appear in both training and validation."
    )

print("\nDone.")
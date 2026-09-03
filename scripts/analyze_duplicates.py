import pandas as pd
from pathlib import Path

# ==========================================================
# PROJECT PATHS
# ==========================================================

BASE_DIR = Path(__file__).resolve().parent.parent

train_file = BASE_DIR / "dataset" / "train" / "train.csv"
validation_file = BASE_DIR / "dataset" / "validation" / "validation.csv"

# ==========================================================
# LOAD DATA
# ==========================================================

print("=" * 60)
print("DUPLICATE DATASET ANALYSIS")
print("=" * 60)

train_df = pd.read_csv(train_file)
valid_df = pd.read_csv(validation_file)

# Combine datasets
df = pd.concat(
    [train_df, valid_df],
    ignore_index=True
)

print("\nTotal rows:", len(df))

# ==========================================================
# CLEAN COMPLAINT TEXT
# ==========================================================

df["clean_text"] = (
    df["Complaint_Text"]
    .fillna("")
    .astype(str)
    .str.strip()
    .str.lower()
)

print("Unique complaint texts:", df["clean_text"].nunique())

# ==========================================================
# CHECK LABEL CONSISTENCY
# ==========================================================

label_columns = [
    "APCCD_Category",
    "Department",
    "Priority",
    "Severity",
    "Sentiment"
]

print("\n" + "=" * 60)
print("LABEL CONSISTENCY CHECK")
print("=" * 60)

for column in label_columns:

    if column in df.columns:

        label_counts = (
            df.groupby("clean_text")[column]
            .nunique()
        )

        inconsistent_count = (
            label_counts > 1
        ).sum()

        print(
            f"\n{column}: "
            f"{inconsistent_count} complaint texts "
            "have different labels"
        )

# ==========================================================
# MOST REPEATED COMPLAINTS
# ==========================================================

print("\n" + "=" * 60)
print("TOP 10 MOST REPEATED COMPLAINTS")
print("=" * 60)

counts = df["clean_text"].value_counts()

for i, (text, count) in enumerate(
    counts.head(10).items(),
    start=1
):

    print(f"\n{i}. Repeated {count} times")
    print(text)

print("\n" + "=" * 60)
print("ANALYSIS COMPLETE")
print("=" * 60)
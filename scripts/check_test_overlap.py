import pandas as pd
from pathlib import Path

# ==========================================================
# PROJECT PATHS
# ==========================================================

BASE_DIR = Path(__file__).resolve().parent.parent

train_file = BASE_DIR / "dataset" / "train" / "train.csv"
validation_file = BASE_DIR / "dataset" / "validation" / "validation.csv"

test_file = BASE_DIR / "test_dataset" / "unseen_test.csv"


# ==========================================================
# LOAD DATA
# ==========================================================

print("=" * 60)
print("UNSEEN TEST DATA OVERLAP CHECK")
print("=" * 60)

train_df = pd.read_csv(train_file)
validation_df = pd.read_csv(validation_file)
test_df = pd.read_csv(test_file)


# ==========================================================
# NORMALIZE TEXT
# ==========================================================

def clean_text(text):

    return str(text).strip().lower()


train_texts = set(
    train_df["Complaint_Text"]
    .fillna("")
    .apply(clean_text)
)

validation_texts = set(
    validation_df["Complaint_Text"]
    .fillna("")
    .apply(clean_text)
)

existing_texts = train_texts.union(
    validation_texts
)

test_texts = set(
    test_df["Complaint_Text"]
    .fillna("")
    .apply(clean_text)
)


# ==========================================================
# CHECK OVERLAP
# ==========================================================

overlap = test_texts.intersection(
    existing_texts
)


print(f"\nTraining complaints   : {len(train_df)}")
print(f"Validation complaints : {len(validation_df)}")
print(f"New test complaints   : {len(test_df)}")

print("\n" + "=" * 60)
print("OVERLAP RESULT")
print("=" * 60)

print(f"\nExact overlaps found: {len(overlap)}")


if overlap:

    print("\n⚠ OVERLAPPING COMPLAINTS:")

    for i, complaint in enumerate(
        sorted(overlap),
        start=1
    ):
        print(f"\n{i}. {complaint}")

else:

    print("\n✓ SUCCESS!")
    print("No exact complaint text overlaps were found.")
    print("The test dataset contains new complaint wording.")


# ==========================================================
# CHECK DUPLICATES INSIDE TEST DATASET
# ==========================================================

print("\n" + "=" * 60)
print("TEST DATASET DUPLICATE CHECK")
print("=" * 60)

duplicate_count = (
    len(test_df)
    - test_df["Complaint_Text"]
    .fillna("")
    .apply(clean_text)
    .nunique()
)

print(
    f"\nDuplicate complaints inside test dataset: "
    f"{duplicate_count}"
)


if duplicate_count == 0:

    print("✓ All test complaints are unique.")


print("\n" + "=" * 60)
print("CHECK COMPLETE")
print("=" * 60)
import pandas as pd
from pathlib import Path
from sklearn.model_selection import train_test_split

# ==========================================================
# Project Paths
# ==========================================================

BASE_DIR = Path(__file__).resolve().parent.parent

input_file = BASE_DIR / "dataset" / "final" / "APCCD_2026_Preprocessed.csv"

train_file = BASE_DIR / "dataset" / "train" / "train.csv"
validation_file = BASE_DIR / "dataset" / "validation" / "validation.csv"
test_file = BASE_DIR / "dataset" / "test" / "test.csv"

# Create folders if they don't exist
train_file.parent.mkdir(parents=True, exist_ok=True)
validation_file.parent.mkdir(parents=True, exist_ok=True)
test_file.parent.mkdir(parents=True, exist_ok=True)

# ==========================================================
# Load Dataset
# ==========================================================

print("=" * 60)
print("Loading Preprocessed Dataset...")
print("=" * 60)

df = pd.read_csv(input_file)

print("Dataset Loaded Successfully!")
print("Shape:", df.shape)

# ==========================================================
# Split Dataset
# ==========================================================

# First split: 70% train, 30% temp
train_df, temp_df = train_test_split(
    df,
    test_size=0.30,
    random_state=42,
    shuffle=True
)

# Second split: 15% validation, 15% test
validation_df, test_df = train_test_split(
    temp_df,
    test_size=0.50,
    random_state=42,
    shuffle=True
)

# ==========================================================
# Save Files
# ==========================================================

train_df.to_csv(train_file, index=False)
validation_df.to_csv(validation_file, index=False)
test_df.to_csv(test_file, index=False)

# ==========================================================
# Report
# ==========================================================

print("\n" + "=" * 60)
print("Dataset Split Completed Successfully!")
print("=" * 60)

print("\nTraining Set     :", train_df.shape)
print("Validation Set  :", validation_df.shape)
print("Test Set        :", test_df.shape)

print("\nSaved Files:")
print(train_file)
print(validation_file)
print(test_file)

print("\nDone.")
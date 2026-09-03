import pandas as pd

# -------------------------------
# Read the original NYC dataset
# -------------------------------
df = pd.read_csv(
    "D:/Complaint_Analyzer/dataset/raw/erm2-nwe9.csv",
    low_memory=False
)

# -------------------------------
# Read category mapping
# -------------------------------
mapping = pd.read_csv(
    "D:/Complaint_Analyzer/dataset/final/category_mapping.csv"
)

# -------------------------------
# Keep only required columns
# -------------------------------
columns = [
    "unique_key",
    "created_date",
    "complaint_type",
    "descriptor",
    "agency",
    "status",
    "city",
    "incident_address",
    "latitude",
    "longitude"
]

df = df[columns]

# -------------------------------
# Merge with mapping file
# -------------------------------
df = df.merge(
    mapping,
    left_on="complaint_type",
    right_on="Complaint_Type",
    how="left"
)

print(df.head())
print(df.shape)
# Count mapped and unmapped complaints
print("\n===== Mapping Summary =====")
print(df["APCCD_Category"].value_counts(dropna=False))

print("\nMissing Category Mappings:")
print(df[df["APCCD_Category"].isna()]["complaint_type"].value_counts().head(30))
# --------------------------------
# Keep only mapped complaints
# --------------------------------
clean_df = df.dropna(subset=["APCCD_Category"])

# Reset index
clean_df = clean_df.reset_index(drop=True)

print("\nFinal Clean Dataset Shape:")
print(clean_df.shape)

# Save cleaned dataset
clean_df.to_csv(
    "D:/Complaint_Analyzer/dataset/processed/NYC311_Clean.csv",
    index=False
)

print("NYC311_Clean.csv saved successfully!")
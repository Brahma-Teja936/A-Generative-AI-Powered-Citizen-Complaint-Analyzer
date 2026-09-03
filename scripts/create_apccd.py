import pandas as pd

# ==========================================================
# STEP 1: Load Clean Dataset
# ==========================================================

df = pd.read_csv(
    "D:/Complaint_Analyzer/dataset/processed/NYC311_Clean.csv"
)

print("=" * 60)
print("NYC311_Clean.csv Loaded Successfully!")
print("=" * 60)
print("Dataset Shape:", df.shape)


# ==========================================================
# STEP 2: Generate Complaint IDs
# ==========================================================

df.insert(
    0,
    "Complaint_ID",
    [f"AP2026{i:06d}" for i in range(1, len(df) + 1)]
)

print("\nComplaint IDs Generated Successfully!")


# ==========================================================
# STEP 3: Read Priority Mapping
# ==========================================================

priority_df = pd.read_csv(
    "D:/Complaint_Analyzer/dataset/final/priority_mapping.csv"
)

print("\nPriority Mapping Loaded!")
print(priority_df)


# ==========================================================
# STEP 4: Read Severity Mapping
# ==========================================================

severity_df = pd.read_csv(
    "D:/Complaint_Analyzer/dataset/final/severity_mapping.csv"
)

print("\nSeverity Mapping Loaded!")
print(severity_df)


# ==========================================================
# STEP 5: Merge Priority
# ==========================================================

df = df.merge(
    priority_df,
    on="APCCD_Category",
    how="left"
)

print("\nPriority Added Successfully!")


# ==========================================================
# STEP 6: Merge Severity
# ==========================================================

df = df.merge(
    severity_df,
    on="APCCD_Category",
    how="left"
)

print("\nSeverity Added Successfully!")


# ==========================================================
# STEP 7: Display Sample Records
# ==========================================================

print("\nSample Records\n")

print(
    df[
        [
            "Complaint_ID",
            "complaint_type",
            "APCCD_Category",
            "Department",
            "Priority",
            "Severity"
        ]
    ].head(10)
)


# ==========================================================
# STEP 8: Check Missing Values
# ==========================================================

print("\nMissing Priority Values :", df["Priority"].isnull().sum())
print("Missing Severity Values :", df["Severity"].isnull().sum())


# ==========================================================
# STEP 9: Display Category Distribution
# ==========================================================

print("\nComplaint Category Distribution\n")

print(df["APCCD_Category"].value_counts())


# ==========================================================
# STEP 10: Save Final Dataset
# ==========================================================

output_path = "D:/Complaint_Analyzer/dataset/final/APCCD_2026.csv"

df.to_csv(
    output_path,
    index=False
)

print("\n" + "=" * 60)
print("APCCD_2026.csv Created Successfully!")
print("=" * 60)

print("\nSaved Location:")
print(output_path)

print("\nFinal Dataset Shape:")
print(df.shape)

print("\nColumns in Dataset:\n")
print(df.columns.tolist())
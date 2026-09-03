import pandas as pd

# Load dataset
df = pd.read_csv(
    "D:/Complaint_Analyzer/dataset/raw/erm2-nwe9.csv",
    low_memory=False
)

# Required columns
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

# Save all complaint types
complaints = df["complaint_type"].value_counts().reset_index()

complaints.columns = ["Complaint_Type", "Count"]

complaints.to_csv(
    "D:/Complaint_Analyzer/dataset/processed/Complaint_Types.csv",
    index=False
)

print("✅ Complaint_Types.csv created successfully!")
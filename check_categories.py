import pandas as pd

file_path = r"D:\complaint\Complaint_Analyzer\dataset\final\APCCD_2026.csv"

df = pd.read_csv(file_path)

print("Category distribution:")
print(df["APCCD_Category"].value_counts())

print("\nUnique categories:")
print(df["APCCD_Category"].unique())
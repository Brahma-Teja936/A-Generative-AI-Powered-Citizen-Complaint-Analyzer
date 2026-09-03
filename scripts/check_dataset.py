import pandas as pd


file_path = "dataset/processed/NYC311_Clean.csv"


df = pd.read_csv(file_path)


print("Dataset Shape:")
print(df.shape)


print("\nColumns:")
print(df.columns)


print("\nFirst 5 rows:")
print(df.head())
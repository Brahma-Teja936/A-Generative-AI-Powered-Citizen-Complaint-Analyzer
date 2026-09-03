import pandas as pd

df = pd.read_csv("D:/Complaint_Analyzer/dataset/raw/311_Service_Requests_from_2010_to_Present.csv")

'''print(df.head())
print(df.info())
print(df.columns)
print(df.shape)'''
print(df.isnull().sum())
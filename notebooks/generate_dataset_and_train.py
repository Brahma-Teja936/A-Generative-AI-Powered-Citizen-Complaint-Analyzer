"""
CivicAI — Machine Learning Dataset Generation & Model Training Pipeline
Trains 6 classification models:
- Department
- Category
- Subcategory
- Severity (LOW, MEDIUM, HIGH, CRITICAL)
- Priority (LOW, MEDIUM, HIGH, VERY HIGH, CRITICAL)
- Urgency (IMMEDIATE, WITHIN 24 HOURS, WITHIN 3 DAYS, WITHIN 7 DAYS, ROUTINE)

Outputs:
- dataset/training/civic_complaints.csv (Exact 7-column schema)
- models/tfidf_vectorizer.pkl
- models/department_model.pkl
- models/category_model.pkl
- models/subcategory_model.pkl
- models/severity_model.pkl
- models/priority_model.pkl
- models/urgency_model.pkl
- models/label_encoders.pkl
- models/model_metrics.json
"""

import os
import re
import json
import random
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, precision_recall_fscore_support, confusion_matrix
from xgboost import XGBClassifier
import joblib

# Ensure reproducible generation
random.seed(42)
np.random.seed(42)

# Templates for synthetic generation across civic domains
DOMAINS = [
    {
        "department": "Roads & Infrastructure",
        "category": "Road Maintenance",
        "templates": [
            ("Pothole on main road near {loc} causing vehicle damage and traffic congestion.", "Potholes", "MEDIUM", "MEDIUM", "WITHIN 3 DAYS"),
            ("Massive deep pothole near {loc} where two bikers slipped and got injured.", "Potholes", "HIGH", "HIGH", "WITHIN 24 HOURS"),
            ("Dangerous crater-sized road collapse on flyover near {loc}, vehicles at extreme risk of falling.", "Road Collapse", "CRITICAL", "CRITICAL", "IMMEDIATE"),
            ("Speed breaker not painted with reflective lines near {loc}, causing dangerous vehicle jumps.", "Speed Breaker", "LOW", "LOW", "WITHIN 7 DAYS"),
            ("Footpath tiles broken and open construction debris left near {loc}.", "Footpath", "LOW", "LOW", "ROUTINE"),
            ("Main road divider broken and sharp metal protruding into traffic lane near {loc}.", "Road Divider", "HIGH", "HIGH", "WITHIN 24 HOURS"),
            ("రోడ్డుపై పెద్ద గుంతలు పడ్డాయి {loc} వద్ద, వాహనాలు తిరగడం కష్టంగా ఉంది.", "Potholes", "MEDIUM", "MEDIUM", "WITHIN 3 DAYS"),
            ("{loc} కే పాస్ సడక్ పర్ గహరే గడ్డే హో గయే హై జిస్సే హాద్సే హో రహే హై.", "Potholes", "HIGH", "HIGH", "WITHIN 24 HOURS"),
        ]
    },
    {
        "department": "Water Supply & Sewerage",
        "category": "Water & Drainage",
        "templates": [
            ("Drinking water pipe burst near {loc}, thousands of liters of clean water flooding road.", "Pipeline Burst", "HIGH", "HIGH", "WITHIN 24 HOURS"),
            ("Contaminated brown foul-smelling tap water supplied to households near {loc}, children falling sick.", "Contaminated Water", "CRITICAL", "CRITICAL", "IMMEDIATE"),
            ("No municipal water supply for the past 5 days in {loc}, residents facing severe crisis.", "Water Shortage", "HIGH", "HIGH", "WITHIN 24 HOURS"),
            ("Sewage manhole overflowing on street near {loc}, black wastewater entering residences.", "Sewage Overflow", "HIGH", "HIGH", "WITHIN 24 HOURS"),
            ("Deep open manhole without cover near school in {loc}, immediate risk of children falling in.", "Open Manhole", "CRITICAL", "CRITICAL", "IMMEDIATE"),
            ("Low water pressure in municipal pipeline near {loc}.", "Low Pressure", "LOW", "LOW", "ROUTINE"),
            ("డ్రింకింగ్ వాటర్ లో మురికి నీరు కలిసి వస్తోంది {loc} లో, ప్రజలు రోగాల బారిన పడుతున్నారు.", "Contaminated Water", "CRITICAL", "CRITICAL", "IMMEDIATE"),
            ("{loc} మే నల్ సే గందా బద్బూదార్ పానీ ఆ రహా హై ఔర్ లోగ్ బీమార్ పడ్ రహే హై.", "Contaminated Water", "CRITICAL", "CRITICAL", "IMMEDIATE"),
            ("రోడ్డుపై మ్యాన్‌హోల్ మూత లేకుండా తెరిచి ఉంది {loc} వద్ద చాలా ప్రమాదకరం.", "Open Manhole", "CRITICAL", "CRITICAL", "IMMEDIATE"),
        ]
    },
    {
        "department": "Electricity & Power",
        "category": "Power Infrastructure",
        "templates": [
            ("High voltage 11kV live electrical wire snapped and lying sparking on flooded road near {loc}.", "Live Wire Hazard", "CRITICAL", "CRITICAL", "IMMEDIATE"),
            ("Electrical transformer caught fire with explosions near {loc} market area.", "Transformer Fire", "CRITICAL", "CRITICAL", "IMMEDIATE"),
            ("Complete blackout in {loc} sector affecting dialysis and oxygen patient homes.", "Power Outage", "HIGH", "VERY HIGH", "IMMEDIATE"),
            ("Streetlights not working for 2 weeks in {loc}, complete dark stretch unsafe for women.", "Streetlight Outage", "MEDIUM", "HIGH", "WITHIN 3 DAYS"),
            ("Electric pole tilted dangerously at 45 degrees over residential gate in {loc}.", "Tilted Electric Pole", "HIGH", "HIGH", "WITHIN 24 HOURS"),
            ("Exposed electric meter junction box with bare sparking wires near park in {loc}.", "Exposed Meter Box", "HIGH", "HIGH", "WITHIN 24 HOURS"),
            ("కరెంట్ వైర్ తెగి రోడ్డుపై పడింది {loc} లో, నిప్పులు చెరుగుతున్నాయి ప్రాణాపాయం ఉంది.", "Live Wire Hazard", "CRITICAL", "CRITICAL", "IMMEDIATE"),
            ("{loc} కే పాస్ ట్రాన్స్‌ఫార్మర్ మే ఆగ్ లగ్ గయీ హై బడా ధమాకా హో సక్తా హై.", "Transformer Fire", "CRITICAL", "CRITICAL", "IMMEDIATE"),
            ("స్ట్రీట్ లైట్లు వెలగడం లేదు {loc} లో చీకటిగా ఉంది దొంగతనాలు జరుగుతున్నాయి.", "Streetlight Outage", "MEDIUM", "MEDIUM", "WITHIN 3 DAYS"),
        ]
    },
    {
        "department": "Public Health & Sanitation",
        "category": "Sanitation & Hygiene",
        "templates": [
            ("Gigantic illegal garbage dump burning toxic plastic smoke choking residents near {loc}.", "Garbage Burning", "HIGH", "VERY HIGH", "WITHIN 24 HOURS"),
            ("Dead stray cattle carcass lying decaying near primary school gate in {loc}.", "Animal Carcass", "HIGH", "HIGH", "WITHIN 24 HOURS"),
            ("Massive garbage overflow uncollected for 10 days outside vegetable market in {loc}.", "Garbage Overflow", "MEDIUM", "MEDIUM", "WITHIN 3 DAYS"),
            ("Stagnant black drainage puddle breeding swarms of dengue mosquitoes near {loc}.", "Mosquito Breeding", "MEDIUM", "MEDIUM", "WITHIN 7 DAYS"),
            ("Hazardous biomedical hospital syringes and infected waste dumped openly in {loc} plot.", "Biomedical Waste", "CRITICAL", "CRITICAL", "IMMEDIATE"),
            ("Public toilet facility choked, leaking sewage onto pavement near {loc}.", "Public Toilet Blockage", "MEDIUM", "MEDIUM", "WITHIN 3 DAYS"),
            ("చెత్త కుప్పలు పేరుకుపోయి దుర్వాసన వస్తోంది {loc} లో వ్యాధులు ప్రబలుతున్నాయి.", "Garbage Overflow", "MEDIUM", "MEDIUM", "WITHIN 3 DAYS"),
            ("{loc} కే పాస్ కచరే కా ఢేర్ లగా హై ఔర్ బీమారియాన్ ఫైల్ రహి హై.", "Garbage Overflow", "MEDIUM", "MEDIUM", "WITHIN 3 DAYS"),
            ("ఆసుపత్రి వ్యర్థాలు బయోమెడికల్ వేస్ట్ రోడ్డుపై పడేశారు {loc} వద్ద తక్షణమే తొలగించాలి.", "Biomedical Waste", "CRITICAL", "CRITICAL", "IMMEDIATE"),
        ]
    },
    {
        "department": "Fire & Emergency Services",
        "category": "Fire & Disaster",
        "templates": [
            ("Major commercial building fire raging on 3rd floor with people trapped inside at {loc}.", "Building Fire", "CRITICAL", "CRITICAL", "IMMEDIATE"),
            ("Commercial LPG gas cylinder warehouse leakage with heavy gas smell spreading in {loc}.", "Gas Leakage", "CRITICAL", "CRITICAL", "IMMEDIATE"),
            ("Massive old banyan tree uprooted in storm, crushed two cars and blocked emergency exit at {loc}.", "Fallen Tree Hazard", "HIGH", "VERY HIGH", "IMMEDIATE"),
            ("Dilapidated 3-story residential building structural crack with falling wall debris at {loc}.", "Building Collapse Threat", "CRITICAL", "CRITICAL", "IMMEDIATE"),
            ("Chemical tanker overturned leaking inflammable liquid on bypass road near {loc}.", "Chemical Spill", "CRITICAL", "CRITICAL", "IMMEDIATE"),
            ("{loc} లోని అపార్ట్‌మెంట్‌లో పెద్ద ఎత్తున మంటలు చెలరేగాయి, ప్రజలు చిక్కుకుపోయారు సహాయం కావాలి.", "Building Fire", "CRITICAL", "CRITICAL", "IMMEDIATE"),
            ("{loc} కే పాస్ ఎల్‌పీజీ సిలిండర్ గోదామ్ సే గ్యాస్ లీకేజ్ హో రహా హై భయంకర పరిస్థితి.", "Gas Leakage", "CRITICAL", "CRITICAL", "IMMEDIATE"),
        ]
    },
    {
        "department": "Public Safety & Police",
        "category": "Civic Safety & Law",
        "templates": [
            ("Unsafe deep construction basement excavated without safety barricade or warning lights near {loc}.", "Unsafe Construction", "HIGH", "HIGH", "WITHIN 24 HOURS"),
            ("Traffic signal non-functional at high-speed intersection in {loc}, regular near-fatal crashes.", "Traffic Signal Failure", "HIGH", "VERY HIGH", "WITHIN 24 HOURS"),
            ("Illegal encroachments blocking emergency fire tender access lane in {loc} market.", "Encroachment", "MEDIUM", "HIGH", "WITHIN 3 DAYS"),
            ("Open illegal borewell pit left uncovered in {loc} vacant plot where small children play.", "Open Borewell Pit", "CRITICAL", "CRITICAL", "IMMEDIATE"),
            ("Abandoned rusty vehicle loaded with scrap blocking bus bay near {loc}.", "Abandoned Vehicle", "LOW", "LOW", "WITHIN 7 DAYS"),
            ("ట్రాఫిక్ సిగ్నల్ పనిచేయడం లేదు {loc} చౌరస్తాలో నిత్యం ప్రమాదాలు జరుగుతున్నాయి.", "Traffic Signal Failure", "HIGH", "VERY HIGH", "WITHIN 24 HOURS"),
            ("{loc} మే ఖులా బోర్వెల్ గడ్డా బచ్చో కే ఖేల్నే కి జగహ్ పర్ హై తురంత్ బంద్ కియా జాయే.", "Open Borewell Pit", "CRITICAL", "CRITICAL", "IMMEDIATE"),
        ]
    },
    {
        "department": "Town Planning & Parks",
        "category": "Parks & Urban Planning",
        "templates": [
            ("Public park swing and slide sets rusted with sharp jagged edges injuring children in {loc}.", "Damaged Playground", "MEDIUM", "MEDIUM", "WITHIN 7 DAYS"),
            ("Illegal commercial billboard hoarding erected without permit hanging dangerously in {loc}.", "Illegal Hoarding", "HIGH", "HIGH", "WITHIN 24 HOURS"),
            ("Encroachment on municipal park boundary by private builder fencing in {loc}.", "Park Encroachment", "MEDIUM", "MEDIUM", "WITHIN 7 DAYS"),
            ("Street name boards missing or damaged throughout {loc} residential layout.", "Signage Damage", "LOW", "LOW", "ROUTINE"),
            ("పార్కులో పిల్లల ఆట స్థలంలో పరికరాలు విరిగిపోయి ప్రమాదకరంగా ఉన్నాయి {loc} లో.", "Damaged Playground", "MEDIUM", "MEDIUM", "WITHIN 7 DAYS"),
        ]
    }
]

LOCATIONS = [
    "MG Road Metro Station", "RTC Cross Roads", "Jubilee Hills Check Post", "Ameerpet Center",
    "Gachibowli Flyover", "Charminar Main Bazaar", "Kukatpally Housing Board", "Secunderabad Railway Station",
    "Hitech City Mindspace", "Dilsukhnagar Bus Depot", "Banjara Hills Road No 12", "Begumpet Airport Road",
    "Madhapur Police Station junction", "Tarnaka Tarnaka signal", "Uppal Ring Road", "Koti Women's College",
    "Lingampally Market", "Alwal Main Road", "Mehdipatnam Bus Stop", "Nagole X Roads"
]

VARIATIONS = [
    "Please send inspection team immediately.",
    "Situation is deteriorating quickly.",
    "Multiple residents have reported this problem.",
    "This has become an urgent public hazard.",
    "Kindly take strict and swift civic action.",
    "Pedestrians and daily commuters are suffering badly.",
    "Danger to public health and safety.",
    "The municipal corporation needs to inspect and resolve this immediately."
]

def generate_dataset(target_count=5200):
    rows = []
    
    # Collect all template tuples
    all_items = []
    for domain in DOMAINS:
        dept = domain["department"]
        cat = domain["category"]
        for tmpl, subcat, sev, pri, urg in domain["templates"]:
            all_items.append((dept, cat, subcat, sev, pri, urg, tmpl))
            
    while len(rows) < target_count:
        dept, cat, subcat, sev, pri, urg, tmpl = random.choice(all_items)
        loc = random.choice(LOCATIONS)
        complaint_text = tmpl.format(loc=loc)
        
        # Add random natural variation
        if random.random() > 0.4:
            complaint_text += " " + random.choice(VARIATIONS)
            
        rows.append({
            "complaint": complaint_text,
            "department": dept,
            "category": cat,
            "subcategory": subcat,
            "severity": sev,
            "priority": pri,
            "urgency": urg
        })
        
    df = pd.DataFrame(rows)
    # Ensure exact 7 columns
    df = df[["complaint", "department", "category", "subcategory", "severity", "priority", "urgency"]]
    return df

def clean_text(text):
    text = str(text).lower()
    text = re.sub(r'[\r\n\t]+', ' ', text)
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

def train_and_export_models():
    os.makedirs("dataset/training", exist_ok=True)
    os.makedirs("models", exist_ok=True)
    
    dataset_csv = "dataset/training/civic_complaints.csv"
    print(f"Generating synthetic dataset with 5,200+ samples...")
    df = generate_dataset(5200)
    df.to_csv(dataset_csv, index=False, encoding='utf-8')
    print(f"Saved dataset to {dataset_csv} (Rows: {len(df)})")
    
    # Text Preprocessing
    print("Preprocessing complaints...")
    df['clean_complaint'] = df['complaint'].apply(clean_text)
    
    # TF-IDF Vectorization
    print("Fitting TF-IDF Vectorizer...")
    tfidf = TfidfVectorizer(max_features=5000, ngram_range=(1, 2), sublinear_tf=True)
    X = tfidf.fit_transform(df['clean_complaint'])
    joblib.dump(tfidf, "models/tfidf_vectorizer.pkl")
    print("Saved models/tfidf_vectorizer.pkl")
    
    targets = ["department", "category", "subcategory", "severity", "priority", "urgency"]
    label_encoders = {}
    metrics = {}
    
    for target in targets:
        print(f"\n--- Training XGBoost Classifier for Target: [{target}] ---")
        le = LabelEncoder()
        y = le.fit_transform(df[target])
        label_encoders[target] = le
        
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        
        clf = XGBClassifier(
            n_estimators=100,
            max_depth=6,
            learning_rate=0.1,
            eval_metric='mlogloss',
            random_state=42,
            n_jobs=-1
        )
        clf.fit(X_train, y_train)
        
        # Evaluation
        y_pred = clf.predict(X_test)
        acc = float(accuracy_score(y_test, y_pred))
        precision, recall, f1, _ = precision_recall_fscore_support(
            y_test, y_pred, average='weighted', zero_division=0
        )
        conf_mat = confusion_matrix(y_test, y_pred).tolist()
        
        metrics[target] = {
            "accuracy": round(acc, 4),
            "precision": round(float(precision), 4),
            "recall": round(float(recall), 4),
            "f1": round(float(f1), 4),
            "classes": le.classes_.tolist(),
            "confusion_matrix": conf_mat
        }
        print(f"[{target}] Accuracy: {acc*100:.2f}%, F1-Score: {f1:.4f}")
        
        model_filename = f"models/{target}_model.pkl"
        joblib.dump(clf, model_filename)
        print(f"Saved {model_filename}")
        
    # Save label encoders and evaluation metrics
    joblib.dump(label_encoders, "models/label_encoders.pkl")
    with open("models/model_metrics.json", "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)
    print("\nAll 7 ML models, label encoders, and metrics successfully exported!")

if __name__ == "__main__":
    train_and_export_models()

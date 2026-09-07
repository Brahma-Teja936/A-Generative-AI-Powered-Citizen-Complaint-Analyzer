import os
import csv
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
CSV_PATH = BASE_DIR / "complaints.csv"

# Comprehensive civic dataset with complaint text, department, category, subcategory, severity, priority, urgency
DATASET_ENTRIES = [
    # --- Roads & Infrastructure ---
    ("There is a huge pothole near the college entrance and vehicles are almost falling.", "Roads & Infrastructure", "Infrastructure", "Pothole", "HIGH", "HIGH", "WITHIN 24 HOURS"),
    ("Large pothole causing accidents on the main highway junction.", "Roads & Infrastructure", "Infrastructure", "Pothole", "HIGH", "HIGH", "WITHIN 24 HOURS"),
    ("Massive crater on arterial road damaged three car axles this morning.", "Roads & Infrastructure", "Infrastructure", "Pothole", "HIGH", "HIGH", "WITHIN 24 HOURS"),
    ("Bridge expansion joint has cracked open and concrete is crumbling, posing collapse hazard.", "Roads & Infrastructure", "Infrastructure", "Road Damage", "CRITICAL", "URGENT", "IMMEDIATE"),
    ("Asphalt is completely washed away following monsoon rain leaving sharp stone surface.", "Roads & Infrastructure", "Infrastructure", "Road Damage", "MEDIUM", "MEDIUM", "WITHIN 3 DAYS"),
    ("Footpath paver blocks are broken and uneven, elderly pedestrians are tripping.", "Roads & Infrastructure", "Infrastructure", "Broken Footpath", "MEDIUM", "MEDIUM", "WITHIN 7 DAYS"),
    ("Road divider concrete slab smashed by truck and lying across fast lane.", "Roads & Infrastructure", "Infrastructure", "Damaged Divider", "HIGH", "HIGH", "WITHIN 24 HOURS"),
    ("Stop sign and speed breaker warning board knocked down at dangerous curve.", "Roads & Infrastructure", "Infrastructure", "Missing Signage", "HIGH", "HIGH", "WITHIN 24 HOURS"),
    ("Fallen tree branch and construction rubble blocking two lanes of public road.", "Roads & Infrastructure", "Infrastructure", "Road Blockage", "HIGH", "HIGH", "WITHIN 24 HOURS"),
    ("Flyover expansion plate vibrating dangerously under heavy vehicle traffic.", "Roads & Infrastructure", "Infrastructure", "Road Damage", "CRITICAL", "URGENT", "IMMEDIATE"),
    ("Pedestrian curb completely dislodged into cycling lane.", "Roads & Infrastructure", "Infrastructure", "Broken Footpath", "LOW", "LOW", "ROUTINE"),
    ("Small road depression developing near speed breaker on residential street.", "Roads & Infrastructure", "Infrastructure", "Pothole", "LOW", "LOW", "ROUTINE"),

    # --- Water Supply ---
    ("No drinking water supply in our locality for the past five days, borewells dried up.", "Water Supply", "Water", "No Water Supply", "HIGH", "HIGH", "WITHIN 24 HOURS"),
    ("Main drinking water pipeline burst flooding the entire colony street with clean water.", "Water Supply", "Water", "Pipeline Damage", "HIGH", "HIGH", "WITHIN 24 HOURS"),
    ("Tap water coming out dark brown and smelling like sewage for three days.", "Water Supply", "Water", "Contaminated Water", "CRITICAL", "URGENT", "IMMEDIATE"),
    ("Extremely low water pressure on 2nd and 3rd floors despite pump running.", "Water Supply", "Water", "Low Pressure", "MEDIUM", "MEDIUM", "WITHIN 3 DAYS"),
    ("Underground distribution valve leaking water onto road creating giant puddle.", "Water Supply", "Water", "Water Leakage", "MEDIUM", "MEDIUM", "WITHIN 3 DAYS"),
    ("Water tanker scheduled for municipal colony never arrived today.", "Water Supply", "Water", "No Water Supply", "MEDIUM", "HIGH", "WITHIN 24 HOURS"),
    ("Sewage water mixing into drinking water supply, children falling ill.", "Water Supply", "Water", "Contaminated Water", "CRITICAL", "URGENT", "IMMEDIATE"),
    ("Public water standpost tap missing, water gushing onto sidewalk continuously.", "Water Supply", "Water", "Water Leakage", "MEDIUM", "MEDIUM", "WITHIN 3 DAYS"),
    ("Chlorine smell extremely strong and burning eyes when using municipal water.", "Water Supply", "Water", "Contaminated Water", "HIGH", "HIGH", "WITHIN 24 HOURS"),
    ("Minor drip from municipal water meter connection outside house.", "Water Supply", "Water", "Water Leakage", "LOW", "LOW", "ROUTINE"),

    # --- Electricity ---
    ("High tension electric cable snapped and sparking violently on wet roadway.", "Electricity", "Electricity", "Electrical Hazard", "CRITICAL", "URGENT", "IMMEDIATE"),
    ("Distribution transformer caught fire with thick smoke and loud crackling noises.", "Electricity", "Electricity", "Transformer Issue", "CRITICAL", "URGENT", "IMMEDIATE"),
    ("Total power blackout in entire sector for more than 14 hours in extreme heat.", "Electricity", "Electricity", "Power Outage", "HIGH", "HIGH", "WITHIN 24 HOURS"),
    ("Wooden electricity pole rotting at the base and leaning heavily towards a house.", "Electricity", "Electricity", "Broken Pole", "CRITICAL", "URGENT", "IMMEDIATE"),
    ("Frequent severe voltage fluctuations burning home appliances and computers.", "Electricity", "Electricity", "Power Outage", "MEDIUM", "MEDIUM", "WITHIN 3 DAYS"),
    ("Open fuse box with exposed live 440V copper wires at child height near school.", "Electricity", "Electricity", "Electrical Hazard", "CRITICAL", "URGENT", "IMMEDIATE"),
    ("Underground power cable damaged during pipeline excavation leaving area dark.", "Electricity", "Electricity", "Damaged Wiring", "HIGH", "HIGH", "WITHIN 24 HOURS"),
    ("Loose overhead electrical wires sagging low enough to touch top of trucks.", "Electricity", "Electricity", "Damaged Wiring", "HIGH", "HIGH", "WITHIN 24 HOURS"),
    ("Street electric junction box cover missing, inside wires exposed to rain.", "Electricity", "Electricity", "Electrical Hazard", "HIGH", "HIGH", "WITHIN 24 HOURS"),
    ("Electricity meter display glass cracked but power supply running normally.", "Electricity", "Electricity", "Electrical Hazard", "LOW", "LOW", "ROUTINE"),

    # --- Waste Management ---
    ("Garbage collection truck has not visited our street for two weeks.", "Waste Management", "Waste Management", "Missed Collection", "HIGH", "HIGH", "WITHIN 24 HOURS"),
    ("Overflowing commercial waste bin spilling rotting food and attracting stray dogs.", "Waste Management", "Waste Management", "Overflowing Bin", "HIGH", "HIGH", "WITHIN 24 HOURS"),
    ("Illegal dumping of biomedical and chemical waste bags in open municipal plot.", "Waste Management", "Waste Management", "Illegal Dumping", "CRITICAL", "URGENT", "IMMEDIATE"),
    ("Huge mound of household trash dumped at corner blocking pedestrian walkway.", "Waste Management", "Waste Management", "Garbage Accumulation", "MEDIUM", "MEDIUM", "WITHIN 3 DAYS"),
    ("Waste disposal workers burning plastic and rubber trash creating toxic fumes.", "Waste Management", "Waste Management", "Illegal Dumping", "HIGH", "HIGH", "WITHIN 24 HOURS"),
    ("Community green waste container broken and garbage scattered across park.", "Waste Management", "Waste Management", "Overflowing Bin", "MEDIUM", "MEDIUM", "WITHIN 3 DAYS"),
    ("Construction debris and concrete rubble dumped illegally on lake bed.", "Waste Management", "Waste Management", "Illegal Dumping", "HIGH", "HIGH", "WITHIN 24 HOURS"),
    ("Litter bins along commercial shopping street full and not cleared since weekend.", "Waste Management", "Waste Management", "Overflowing Bin", "LOW", "LOW", "WITHIN 7 DAYS"),
    ("A few scattered dry leaves and paper wrappers around park benches.", "Waste Management", "Waste Management", "Garbage Accumulation", "LOW", "LOW", "ROUTINE"),

    # --- Sanitation ---
    ("Public toilet facility is overflowing with human waste and completely blocked.", "Sanitation", "Sanitation", "Public Toilet Issue", "HIGH", "HIGH", "WITHIN 24 HOURS"),
    ("Dead stray animal decomposing on the sidewalk emitting unbearable stench.", "Sanitation", "Sanitation", "Dead Animal", "HIGH", "HIGH", "WITHIN 24 HOURS"),
    ("Severe rodent and cockroach infestation coming from open municipal ditch.", "Sanitation", "Sanitation", "Pest Infestation", "MEDIUM", "MEDIUM", "WITHIN 3 DAYS"),
    ("Public urinal doors broken and floor covered in stagnant unhygienic water.", "Sanitation", "Sanitation", "Public Toilet Issue", "MEDIUM", "MEDIUM", "WITHIN 7 DAYS"),
    ("Rotting vegetable waste dumped behind market attracting swarms of flies.", "Sanitation", "Sanitation", "Unsanitary Condition", "MEDIUM", "MEDIUM", "WITHIN 3 DAYS"),
    ("Dead pig floating in stormwater canal creating terrible health risk.", "Sanitation", "Sanitation", "Dead Animal", "CRITICAL", "URGENT", "IMMEDIATE"),
    ("Disinfection and sanitization bleaching powder not sprinkled in colony after floods.", "Sanitation", "Sanitation", "Unsanitary Condition", "MEDIUM", "HIGH", "WITHIN 24 HOURS"),
    ("Public handwashing tap in market basin broken and dirty.", "Sanitation", "Sanitation", "Public Toilet Issue", "LOW", "LOW", "ROUTINE"),

    # --- Drainage ---
    ("Stormwater drain completely blocked waterlogging road up to two feet after rain.", "Drainage", "Drainage", "Blocked Drain", "HIGH", "HIGH", "WITHIN 24 HOURS"),
    ("Concrete slab over deep drainage canal collapsed someone could fall in.", "Drainage", "Drainage", "Drain Damage", "CRITICAL", "URGENT", "IMMEDIATE"),
    ("Sewage pipeline burst spilling black waste water over main highway junction.", "Drainage", "Drainage", "Sewage Overflow", "CRITICAL", "URGENT", "IMMEDIATE"),
    ("Underground drain choked causing foul sewage water to back up into houses.", "Drainage", "Drainage", "Sewage Overflow", "HIGH", "HIGH", "WITHIN 24 HOURS"),
    ("Monsoon rainwater cannot drain because heavy silt covers all entry grates.", "Drainage", "Drainage", "Blocked Drain", "HIGH", "HIGH", "WITHIN 24 HOURS"),
    ("Open sewer emitting toxic methane gases causing severe headaches in residents.", "Drainage", "Drainage", "Drain Damage", "HIGH", "HIGH", "WITHIN 24 HOURS"),
    ("Drainage ditch overflowing into vegetable market after brief shower.", "Drainage", "Drainage", "Flooding", "HIGH", "HIGH", "WITHIN 24 HOURS"),
    ("Loose drain grate making loud clattering sound whenever buses drive over it.", "Drainage", "Drainage", "Drain Damage", "LOW", "LOW", "ROUTINE"),
    ("Rainwater drain pipe broken and splashing water onto pedestrian stairs.", "Drainage", "Drainage", "Drain Damage", "MEDIUM", "MEDIUM", "WITHIN 7 DAYS"),

    # --- Street Lighting ---
    ("All streetlights out for 2 kilometers pitch dark road unsafe for women at night.", "Street Lighting", "Street Lighting", "Dark Street", "HIGH", "HIGH", "WITHIN 24 HOURS"),
    ("Streetlight electric pole damaged with live wires exposed on sidewalk.", "Street Lighting", "Street Lighting", "Electrical Fault", "CRITICAL", "URGENT", "IMMEDIATE"),
    ("Street lamp flickering constantly causing disorientation at main junction.", "Street Lighting", "Street Lighting", "Light Not Working", "LOW", "LOW", "ROUTINE"),
    ("Streetlights turned on in broad daylight wasting public municipal electricity.", "Street Lighting", "Street Lighting", "Light Not Working", "LOW", "LOW", "ROUTINE"),
    ("Dark alleyway near women's hostel where all streetlights have been burnt out.", "Street Lighting", "Street Lighting", "Dark Street", "HIGH", "HIGH", "WITHIN 24 HOURS"),
    ("Underpass illumination completely dead driving through in dark is hazardous.", "Street Lighting", "Street Lighting", "Dark Street", "HIGH", "HIGH", "WITHIN 24 HOURS"),
    ("Rusted lamp post leaning heavily over parked cars and footpath ready to fall.", "Street Lighting", "Street Lighting", "Damaged Pole", "HIGH", "HIGH", "WITHIN 24 HOURS"),
    ("Streetlight timer broken lights turn on after midnight and stay on all morning.", "Street Lighting", "Street Lighting", "Light Not Working", "MEDIUM", "MEDIUM", "WITHIN 7 DAYS"),
    ("High mast LED floodlights in bus terminus stopped working completely.", "Street Lighting", "Street Lighting", "Light Not Working", "MEDIUM", "HIGH", "WITHIN 24 HOURS"),

    # --- Traffic ---
    ("Traffic signal non functional at major intersection resulting in four way gridlock.", "Traffic", "Traffic", "Signal Malfunction", "HIGH", "HIGH", "WITHIN 24 HOURS"),
    ("Traffic lights stuck on green both sides causing vehicles to collide at intersection.", "Traffic", "Traffic", "Signal Malfunction", "CRITICAL", "URGENT", "IMMEDIATE"),
    ("Illegal truck parking on both sides of two lane road completely blocking emergency lanes.", "Traffic", "Traffic", "Illegal Parking", "MEDIUM", "MEDIUM", "WITHIN 3 DAYS"),
    ("Missing STOP sign and blind curve warning at dangerous accident prone hill road.", "Traffic", "Traffic", "Missing Traffic Sign", "HIGH", "HIGH", "WITHIN 24 HOURS"),
    ("Heavy commercial vehicles speeding through school zone during morning drop off hours.", "Traffic", "Traffic", "Traffic Congestion", "HIGH", "HIGH", "WITHIN 24 HOURS"),
    ("Vehicles driving wrong side on highway exit ramp creating fatal head-on hazard.", "Traffic", "Traffic", "Traffic Congestion", "CRITICAL", "URGENT", "IMMEDIATE"),
    ("Buses stopping in middle of road instead of designated bus bays blocking traffic.", "Traffic", "Traffic", "Traffic Congestion", "MEDIUM", "MEDIUM", "WITHIN 3 DAYS"),
    ("Pedestrian crossing countdown light broken people unable to cross six lane road.", "Traffic", "Traffic", "Signal Malfunction", "HIGH", "HIGH", "WITHIN 24 HOURS"),
    ("Accident damaged car left stranded in fast lane causing 5km traffic backup.", "Traffic", "Traffic", "Traffic Congestion", "HIGH", "HIGH", "WITHIN 24 HOURS"),

    # --- Public Safety ---
    ("Pack of aggressive feral dogs chasing two wheelers and biting pedestrians.", "Public Safety", "Public Safety", "Stray Animal Threat", "HIGH", "HIGH", "WITHIN 24 HOURS"),
    ("Deep unprotected trench dug near playground kids playing nearby could fall in.", "Public Safety", "Public Safety", "Open Manhole", "CRITICAL", "URGENT", "IMMEDIATE"),
    ("Old dilapidated municipal wall tilting towards public footpath ready to collapse.", "Public Safety", "Public Safety", "Structural Hazard", "CRITICAL", "URGENT", "IMMEDIATE"),
    ("No safety fencing along deep quarry pit near residential colony.", "Public Safety", "Public Safety", "Structural Hazard", "CRITICAL", "URGENT", "IMMEDIATE"),
    ("Massive advertising billboard loose and swinging dangerously in thunderstorm.", "Public Safety", "Public Safety", "Structural Hazard", "CRITICAL", "URGENT", "IMMEDIATE"),
    ("Fire escape door locked with chain in public commercial shopping complex.", "Public Safety", "Public Safety", "Fire Hazard", "CRITICAL", "URGENT", "IMMEDIATE"),
    ("Stray cattle wandering on dark expressway causing fatal vehicle crashes.", "Public Safety", "Public Safety", "Stray Animal Threat", "CRITICAL", "URGENT", "IMMEDIATE"),
    ("Broken handrail on high pedestrian foot overbridge above railway tracks.", "Public Safety", "Public Safety", "Structural Hazard", "HIGH", "HIGH", "WITHIN 24 HOURS"),
    ("Manhole cover completely missing on dark sidewalk, open death trap.", "Public Safety", "Public Safety", "Open Manhole", "CRITICAL", "URGENT", "IMMEDIATE"),

    # --- Public Health ---
    ("Outbreak of malaria and dengue due to stagnant puddle in vacant government ground.", "Public Health", "Public Health", "Disease Outbreak Risk", "CRITICAL", "URGENT", "IMMEDIATE"),
    ("Mosquito breeding heavy in open drain, municipal fogging needed urgently.", "Public Health", "Public Health", "Stagnant Water", "HIGH", "HIGH", "WITHIN 24 HOURS"),
    ("Contaminated drinking water causing severe diarrhea among school children.", "Public Health", "Public Health", "Contaminated Water Hazard", "CRITICAL", "URGENT", "IMMEDIATE"),
    ("Rabid dog bitten several people on market street needs animal control unit.", "Public Health", "Public Health", "Disease Outbreak Risk", "CRITICAL", "URGENT", "IMMEDIATE"),
    ("Rotting animal carcasses disposed in open lot creating severe infection risk.", "Public Health", "Public Health", "Disease Outbreak Risk", "CRITICAL", "URGENT", "IMMEDIATE"),
    ("Hospital primary health clinic lacks basic tetanus injections and snake antivenom.", "Public Health", "Public Health", "Disease Outbreak Risk", "CRITICAL", "URGENT", "IMMEDIATE"),
    ("Roadside food stalls washing plates in filthy gutter water.", "Public Health", "Public Health", "Food Safety Issue", "HIGH", "HIGH", "WITHIN 24 HOURS"),
    ("Chemical fumes from unlicensed battery workshop causing breathing issues.", "Public Health", "Public Health", "Disease Outbreak Risk", "HIGH", "HIGH", "WITHIN 24 HOURS"),
    ("Stagnant water in public park fountain turned into green mosquito nursery.", "Public Health", "Public Health", "Stagnant Water", "MEDIUM", "MEDIUM", "WITHIN 3 DAYS"),

    # --- Parks & Environment ---
    ("Fallen tree branch crushing children play swings in colony park.", "Parks & Environment", "Parks & Environment", "Fallen Tree", "HIGH", "HIGH", "WITHIN 24 HOURS"),
    ("Large dead tree about to fall onto walking path in public botanical garden.", "Parks & Environment", "Parks & Environment", "Fallen Tree", "HIGH", "HIGH", "WITHIN 24 HOURS"),
    ("Lake water turning green with chemical pollution and toxic foam bubbling.", "Parks & Environment", "Parks & Environment", "Environmental Pollution", "CRITICAL", "URGENT", "IMMEDIATE"),
    ("Children slide broken with exposed rusted iron nails in municipal play area.", "Parks & Environment", "Parks & Environment", "Damaged Park Equipment", "HIGH", "HIGH", "WITHIN 24 HOURS"),
    ("Unauthorized illegal chopping of old shade trees along municipal avenue.", "Parks & Environment", "Parks & Environment", "Overgrown Branches", "HIGH", "HIGH", "WITHIN 24 HOURS"),
    ("Overgrown tree branches completely obstructing driver view of road sign.", "Parks & Environment", "Parks & Environment", "Overgrown Branches", "MEDIUM", "MEDIUM", "WITHIN 3 DAYS"),
    ("Park boundary fence broken allowing stray animals to graze and destroy plants.", "Parks & Environment", "Parks & Environment", "Damaged Park Equipment", "MEDIUM", "MEDIUM", "WITHIN 7 DAYS"),
    ("Jogging track paving broken and muddy after rain.", "Parks & Environment", "Parks & Environment", "Damaged Park Equipment", "LOW", "LOW", "ROUTINE"),
    ("Loud commercial sound systems playing music past 1 AM in quiet residential park.", "Parks & Environment", "Parks & Environment", "Noise Pollution", "MEDIUM", "MEDIUM", "WITHIN 3 DAYS"),

    # --- Other ---
    ("Civic complaint helpline number not being answered for four consecutive days.", "Other", "Other", "Helpline Issue", "MEDIUM", "MEDIUM", "WITHIN 7 DAYS"),
    ("Loud commercial speakers blasting past midnight in quiet residential zone.", "Other", "Other", "General Civic Complaint", "HIGH", "HIGH", "WITHIN 24 HOURS"),
    ("Municipal staff demanding cash bribe for issuing birth and death certificates.", "Other", "Other", "General Civic Complaint", "HIGH", "HIGH", "WITHIN 24 HOURS"),
    ("Community library ceiling leaking water over rare books and electrical wiring.", "Other", "Other", "Public Facility Issue", "HIGH", "HIGH", "WITHIN 24 HOURS"),
    ("Public heritage monument defaced with spray paint and illegal advertising posters.", "Other", "Other", "Public Facility Issue", "LOW", "LOW", "ROUTINE"),
    ("Municipal office premises full of uncleaned cobwebs and broken visitor benches.", "Other", "Other", "Public Facility Issue", "LOW", "LOW", "ROUTINE"),
    ("Citizen facilitation center queue token machine broken causing chaos.", "Other", "Other", "Helpline Issue", "MEDIUM", "MEDIUM", "WITHIN 7 DAYS"),
    ("Public bulletin board glass shattered on sidewalk.", "Other", "Other", "Public Facility Issue", "LOW", "LOW", "ROUTINE")
]

LOCATION_AUGMENTATIONS = [
    "near Government High School",
    "on MG Road near the railway station",
    "opposite City Hospital main gate",
    "at Sector 4 residential colony",
    "in front of the central market entrance",
    "near the children's park junction",
    "along the ring road highway flyover",
    "behind the municipal corporation building"
]

DURATION_AUGMENTATIONS = [
    "for the past 3 days",
    "since yesterday morning",
    "for over two weeks now",
    "since last Monday"
]

def generate_full_dataset():
    records = []
    
    for text, dept, cat, subcat, sev, pri, urg in DATASET_ENTRIES:
        # Base record
        records.append({
            "complaint": text,
            "department": dept,
            "category": cat,
            "subcategory": subcat,
            "severity": sev,
            "priority": pri,
            "urgency": urg
        })
        
        # Augmented with location
        for loc in LOCATION_AUGMENTATIONS[:4]:
            records.append({
                "complaint": f"{text} It is located {loc}.",
                "department": dept,
                "category": cat,
                "subcategory": subcat,
                "severity": sev,
                "priority": pri,
                "urgency": urg
            })
            
        # Augmented with duration
        for dur in DURATION_AUGMENTATIONS[:2]:
            records.append({
                "complaint": f"{text} This has been continuing {dur}.",
                "department": dept,
                "category": cat,
                "subcategory": subcat,
                "severity": sev,
                "priority": pri,
                "urgency": urg
            })

    # Write to CSV
    CSV_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(CSV_PATH, "w", newline="", encoding="utf-8") as f:
        fields = ["complaint", "department", "category", "subcategory", "severity", "priority", "urgency"]
        writer = csv.DictWriter(f, fieldnames=fields)
        writer.writeheader()
        for r in records:
            writer.writerow(r)

    print(f"Generated {len(records)} balanced civic records in {CSV_PATH}")

if __name__ == "__main__":
    generate_full_dataset()

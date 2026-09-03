import csv
import os
from pathlib import Path

DATASET_DIR = Path(__file__).resolve().parent / "dataset"
DATASET_DIR.mkdir(parents=True, exist_ok=True)
CSV_PATH = DATASET_DIR / "complaints.csv"

# Base complaints seed with realistic civic issues across all 12 departments, 4 severities, 4 priorities
RAW_DATA = [
    # Roads & Infrastructure
    ("There is a huge pothole near the college entrance and vehicles are almost falling.", "Roads & Infrastructure", "HIGH", "HIGH"),
    ("Large pothole causing accidents on the main highway junction.", "Roads & Infrastructure", "HIGH", "HIGH"),
    ("Massive crater on arterial road damaged three car axles this morning.", "Roads & Infrastructure", "HIGH", "HIGH"),
    ("Bridge expansion joint has cracked open and concrete is crumbling, posing collapse hazard.", "Roads & Infrastructure", "CRITICAL", "URGENT"),
    ("Flyover pillar shows severe structural cracking and rebar exposure.", "Roads & Infrastructure", "CRITICAL", "URGENT"),
    ("Entire stretch of ring road has eroded after rain, vehicles unable to pass.", "Roads & Infrastructure", "HIGH", "HIGH"),
    ("Minor uneven asphalt on residential 4th cross lane.", "Roads & Infrastructure", "LOW", "LOW"),
    ("Small crack developing along the pedestrian sidewalk pavement.", "Roads & Infrastructure", "LOW", "LOW"),
    ("Footpath paving tiles are broken and uneven near post office.", "Roads & Infrastructure", "MEDIUM", "MEDIUM"),
    ("Road divider broken by truck and debris blocking one lane.", "Roads & Infrastructure", "MEDIUM", "MEDIUM"),
    ("Unmarked speed breaker causing motorcyclists to lose balance at night.", "Roads & Infrastructure", "HIGH", "HIGH"),
    ("Road resurfacing left unfinished with loose gravel and sharp stones for two weeks.", "Roads & Infrastructure", "MEDIUM", "MEDIUM"),
    ("Deep trench dug across the road for utility work left unbarricaded.", "Roads & Infrastructure", "CRITICAL", "URGENT"),
    ("Road caving in near sewer line, sinkhole forming rapidly.", "Roads & Infrastructure", "CRITICAL", "URGENT"),
    ("Faded zebra crossing marks near elementary school causing pedestrian crossing risk.", "Roads & Infrastructure", "MEDIUM", "HIGH"),
    ("Curb stones misplaced after storm water drain repair.", "Roads & Infrastructure", "LOW", "LOW"),

    # Water Supply
    ("Contaminated blackish tap water smelling foul coming from municipal line.", "Water Supply", "CRITICAL", "URGENT"),
    ("Drinking water pipeline burst flooding the entire colony road with clean water.", "Water Supply", "HIGH", "HIGH"),
    ("No municipal water supply for the past five days in block C.", "Water Supply", "HIGH", "HIGH"),
    ("Low water pressure in municipal pipeline, water barely reaches ground floor taps.", "Water Supply", "MEDIUM", "MEDIUM"),
    ("Main water distribution pipe cracked and gushing water since early morning.", "Water Supply", "HIGH", "HIGH"),
    ("Sewage water mixing into drinking water supply line, residents falling sick.", "Water Supply", "CRITICAL", "URGENT"),
    ("Water meter damaged and leaking slowly outside house number 45.", "Water Supply", "LOW", "LOW"),
    ("Irregular water supply timings without prior notification from water board.", "Water Supply", "LOW", "MEDIUM"),
    ("Community water standpost tap missing, water running continuously into drain.", "Water Supply", "MEDIUM", "MEDIUM"),
    ("Overhead municipal water storage tank overflowing continuously for hours.", "Water Supply", "MEDIUM", "MEDIUM"),
    ("Water supply contains rust and mud particles, completely unfit for drinking.", "Water Supply", "HIGH", "HIGH"),
    ("Commercial water tanker spilled valve causing local pressure drop.", "Water Supply", "LOW", "LOW"),
    ("Water valve chamber cover missing, posing danger to pedestrians and contaminating valve.", "Water Supply", "HIGH", "HIGH"),
    ("Underground reservoir pump broken down, leaving two thousand families without water.", "Water Supply", "CRITICAL", "URGENT"),

    # Electricity
    ("High voltage electrical wire snapped and hanging dangerously low across street.", "Electricity", "CRITICAL", "URGENT"),
    ("Distribution transformer sparking and emitting dense smoke near children play area.", "Electricity", "CRITICAL", "URGENT"),
    ("Frequent unannounced power cuts lasting 8 to 10 hours daily in Gandhi Nagar.", "Electricity", "HIGH", "HIGH"),
    ("Exposed live electrical wires hanging out of street junction box near bus shelter.", "Electricity", "CRITICAL", "URGENT"),
    ("Severe voltage fluctuations blowing up household electronic appliances.", "Electricity", "HIGH", "HIGH"),
    ("Rotten wooden electric pole leaning precariously towards residential building.", "Electricity", "CRITICAL", "URGENT"),
    ("Electricity meter box outside apartment building sparking during drizzle.", "Electricity", "HIGH", "HIGH"),
    ("Low hanging power cables getting tangled with delivery trucks.", "Electricity", "HIGH", "HIGH"),
    ("Substation humming loudly with burning smell, fear of fire explosion.", "Electricity", "CRITICAL", "URGENT"),
    ("Temporary festival wiring left tied to metal fence carrying current.", "Electricity", "CRITICAL", "URGENT"),
    ("Frequent tripping of local transformer every evening during peak hours.", "Electricity", "MEDIUM", "MEDIUM"),
    ("Electricity meter display blank, unable to read consumption for two months.", "Electricity", "LOW", "LOW"),
    ("Old service wire insulation cracked near rooftop terrace.", "Electricity", "MEDIUM", "MEDIUM"),

    # Sanitation
    ("Public toilet facility near bus terminal choked, overflowing with human waste.", "Sanitation", "CRITICAL", "HIGH"),
    ("Stagnant foul-smelling cesspool behind residential market causing unbearable stench.", "Sanitation", "HIGH", "HIGH"),
    ("Public urinal walls broken, no water connection, completely unsanitary condition.", "Sanitation", "MEDIUM", "MEDIUM"),
    ("Open defecation occurring along railway boundary due to lack of public latrines.", "Sanitation", "HIGH", "HIGH"),
    ("Community toilet doors broken and lights missing, unusable at night for women.", "Sanitation", "HIGH", "HIGH"),
    ("Slaughterhouse blood and animal waste draining openly onto public footpath.", "Sanitation", "CRITICAL", "URGENT"),
    ("Fish market waste not cleaned for three days, creating intense odor and flies.", "Sanitation", "HIGH", "HIGH"),
    ("Sewage cleaning workers operating without safety gear in open sewer manhole.", "Sanitation", "CRITICAL", "URGENT"),
    ("Sanitary napkin vending machine and disposal incinerator broken in community center.", "Sanitation", "LOW", "LOW"),
    ("Stagnant puddles with green algae forming near primary school gate.", "Sanitation", "MEDIUM", "MEDIUM"),
    ("Commercial kitchen dumping cooking oil and greasy grease directly into open street.", "Sanitation", "HIGH", "HIGH"),
    ("Bio-medical waste dumped openly behind private nursing home.", "Sanitation", "CRITICAL", "URGENT"),

    # Waste Management
    ("Garbage has not been collected for several days and is spilling onto the road.", "Waste Management", "HIGH", "HIGH"),
    ("Overflowing municipal garbage bin attracting stray cattle, dogs, and vultures.", "Waste Management", "HIGH", "HIGH"),
    ("Huge garbage dump catching fire and releasing toxic black smoke into neighborhood.", "Waste Management", "CRITICAL", "URGENT"),
    ("Door to door waste collection vehicle has not visited our sector for a week.", "Waste Management", "MEDIUM", "MEDIUM"),
    ("Construction debris and concrete rubble dumped illegally on vacant public plot.", "Waste Management", "MEDIUM", "MEDIUM"),
    ("Rotting vegetable waste dumped by wholesale vendors on service road.", "Waste Management", "HIGH", "HIGH"),
    ("Garbage collection compactor leaking foul leach juice onto main road while driving.", "Waste Management", "MEDIUM", "MEDIUM"),
    ("Broken plastic community bin overturned and trash scattered across pavement.", "Waste Management", "MEDIUM", "MEDIUM"),
    ("Industrial hazardous chemical waste drums dumped near lake bank.", "Waste Management", "CRITICAL", "URGENT"),
    ("Dead animal carcass lying on roadside decomposing and causing extreme health hazard.", "Waste Management", "CRITICAL", "URGENT"),
    ("Littering of plastic bottles and disposable wrappers along market walkway.", "Waste Management", "LOW", "LOW"),
    ("Dry leaves and garden trimmings swept and left in heaps on the sidewalk.", "Waste Management", "LOW", "LOW"),
    ("Electronic waste and broken monitors dumped in open field.", "Waste Management", "MEDIUM", "MEDIUM"),

    # Drainage
    ("Open drainage creating danger for pedestrians and children walking home.", "Drainage", "CRITICAL", "URGENT"),
    ("Stormwater drain clogged with plastic bags, knee-deep waterlogging after mild rain.", "Drainage", "HIGH", "HIGH"),
    ("Broken cement slab over stormwater drain, huge gap where people can fall.", "Drainage", "CRITICAL", "URGENT"),
    ("Underground sewer line choked and backflowing into ground floor home bathrooms.", "Drainage", "CRITICAL", "URGENT"),
    ("Sewage manhole cover missing on main boulevard, unbarricaded death trap.", "Drainage", "CRITICAL", "URGENT"),
    ("Drainage water overflowing across road and entering shops in market area.", "Drainage", "HIGH", "HIGH"),
    ("Culvert blocked with tree branches preventing monsoon runoff flow.", "Drainage", "HIGH", "HIGH"),
    ("Open sewer trench emitting foul toxic gases causing nausea in residents.", "Drainage", "HIGH", "HIGH"),
    ("Drain cover loosened and rattling loudly every time heavy vehicle drives over it.", "Drainage", "LOW", "LOW"),
    ("Slow draining of rainwater on side street due to silt accumulation in gully traps.", "Drainage", "MEDIUM", "MEDIUM"),
    ("Illegal connection of industrial effluent pipe into municipal stormwater drain.", "Drainage", "CRITICAL", "URGENT"),
    ("Side drain grating rusted through and collapsing under pedestrian weight.", "Drainage", "HIGH", "HIGH"),

    # Public Safety
    ("Pack of aggressive stray dogs attacking pedestrians and two-wheelers at night.", "Public Safety", "HIGH", "HIGH"),
    ("Unfenced deep construction pit filled with water near residential playground.", "Public Safety", "CRITICAL", "URGENT"),
    ("Abandoned dilapidated building crumbling onto adjacent public pathway.", "Public Safety", "CRITICAL", "URGENT"),
    ("Overgrown thorny bushes obscuring blind turn near railway underpass.", "Public Safety", "HIGH", "HIGH"),
    ("Rogue elements drinking alcohol and harassing passersby in dark subways.", "Public Safety", "HIGH", "HIGH"),
    ("Large rusted hoarding billboard swaying dangerously in high winds over highway.", "Public Safety", "CRITICAL", "URGENT"),
    ("Fire hydrant vandalized, no working water connection in crowded commercial market.", "Public Safety", "HIGH", "HIGH"),
    ("Unauthorized barricades blocking emergency ambulance access to colony.", "Public Safety", "CRITICAL", "URGENT"),
    ("Slippery moss coating on public footbridge stairs causing multiple slip falls.", "Public Safety", "MEDIUM", "HIGH"),
    ("Missing guard rail along steep river embankment road.", "Public Safety", "CRITICAL", "URGENT"),
    ("Stray cattle resting in middle of unlit bypass road causing collision risk.", "Public Safety", "HIGH", "HIGH"),
    ("Beehive on low tree branch directly outside kindergarten gate.", "Public Safety", "MEDIUM", "HIGH"),
    ("Graffiti and minor vandalism on community information board.", "Public Safety", "LOW", "LOW"),

    # Street Lighting
    ("Entire sector 14 main street is pitch dark because all streetlights are not working.", "Street Lighting", "HIGH", "HIGH"),
    ("Street light pole knocked down by vehicle, wires exposed on wet ground.", "Street Lighting", "CRITICAL", "URGENT"),
    ("Flickering sodium vapor streetlamp making loud buzzing noise all night.", "Street Lighting", "LOW", "LOW"),
    ("Dark stretch on women college approach road due to burnt out LED fixtures.", "Street Lighting", "HIGH", "HIGH"),
    ("Streetlights remaining switched ON during full daylight hours wasting electricity.", "Street Lighting", "LOW", "LOW"),
    ("Streetlight pole rusted at base and wobbling in strong wind.", "Street Lighting", "HIGH", "HIGH"),
    ("Timer switch faulty, street lights turn on only after 10 PM leaving evening dark.", "Street Lighting", "MEDIUM", "MEDIUM"),
    ("Tree branches completely covering street light lamp, blocking all illumination on road.", "Street Lighting", "MEDIUM", "MEDIUM"),
    ("Underpass tunnel lighting completely dark, creating dangerous hazard for drivers.", "Street Lighting", "HIGH", "HIGH"),
    ("Pedestrian walkway decorative light globes smashed by miscreants.", "Street Lighting", "LOW", "LOW"),
    ("High mast tower light in central circle has half of the floodlights dead.", "Street Lighting", "MEDIUM", "MEDIUM"),
    ("Streetlight underground cable damaged during trenching, 12 consecutive poles unlit.", "Street Lighting", "HIGH", "HIGH"),

    # Traffic
    ("Traffic signal at major 4-way intersection not functioning, causing chaos and gridlock.", "Traffic", "HIGH", "HIGH"),
    ("Traffic signal stuck on red in all four directions creating massive vehicle pileup.", "Traffic", "HIGH", "HIGH"),
    ("Illegal commercial parking blocking two lanes of four lane arterial road.", "Traffic", "MEDIUM", "MEDIUM"),
    ("Auto rickshaws parked haphazardly on bus stop bay blocking public buses.", "Traffic", "MEDIUM", "MEDIUM"),
    ("Missing one-way traffic sign causing head-on vehicle near-collisions.", "Traffic", "HIGH", "HIGH"),
    ("Heavy commercial trucks entering narrow residential streets during restricted hours.", "Traffic", "HIGH", "HIGH"),
    ("Speeding vehicles racing on newly paved ring road without speed cameras.", "Traffic", "HIGH", "HIGH"),
    ("Pedestrian signal button broken at hospital crossing, elderly unable to cross.", "Traffic", "MEDIUM", "HIGH"),
    ("Broken down vehicle abandoned in middle lane of bridge causing 2 km bottleneck.", "Traffic", "HIGH", "HIGH"),
    ("Wrong way driving on flyover ramp posing fatal head-on collision threat.", "Traffic", "CRITICAL", "URGENT"),
    ("Traffic sign post bent and twisted by collision, unreadable to motorists.", "Traffic", "LOW", "LOW"),
    ("School zone flashing caution beacon dead for three weeks.", "Traffic", "MEDIUM", "HIGH"),

    # Public Health
    ("Severe outbreak of dengue cases due to stagnant water pool in government compound.", "Public Health", "CRITICAL", "URGENT"),
    ("Mosquito fogging has not been carried out this entire monsoon season in Ward 8.", "Public Health", "HIGH", "HIGH"),
    ("Illegal roadside food vendor operating in filthy conditions right beside open sewer.", "Public Health", "HIGH", "HIGH"),
    ("Contaminated water causing cholera and gastroenteritis cases in slum pocket.", "Public Health", "CRITICAL", "URGENT"),
    ("Dead rats found in public community park water fountain reservoir.", "Public Health", "HIGH", "HIGH"),
    ("Primary health center pharmacy has run out of essential anti-rabies vaccines.", "Public Health", "CRITICAL", "URGENT"),
    ("Uncovered meat shop waste attracting swarms of flies and stench near primary school.", "Public Health", "HIGH", "HIGH"),
    ("Chemical pesticide spraying done without notice causing allergic breathing distress.", "Public Health", "MEDIUM", "HIGH"),
    ("Stray dog suspected of rabies bit three people on station road.", "Public Health", "CRITICAL", "URGENT"),
    ("Public gym outdoor equipment rusted and harboring tetanus risk.", "Public Health", "MEDIUM", "MEDIUM"),
    ("Stagnant water cooler trays in municipal office full of mosquito larvae.", "Public Health", "MEDIUM", "MEDIUM"),
    ("No drinking water facility available for patients waiting at public clinic.", "Public Health", "LOW", "MEDIUM"),

    # Parks & Environment
    ("Huge fallen tree trunk blocking public jogging track and crushing park benches.", "Parks & Environment", "MEDIUM", "MEDIUM"),
    ("Children swing set broken with sharp jagged metal exposed, dangerous for kids.", "Parks & Environment", "HIGH", "HIGH"),
    ("Illegal felling of mature green avenue trees along public garden perimeter.", "Parks & Environment", "HIGH", "HIGH"),
    ("Park boundary wall collapsed, stray cows and pigs entering and ruining garden.", "Parks & Environment", "MEDIUM", "MEDIUM"),
    ("Public park grass overgrown and turning into haven for snakes and rodents.", "Parks & Environment", "MEDIUM", "MEDIUM"),
    ("Lake water covered in toxic chemical froth and hundreds of dead fish floating.", "Parks & Environment", "CRITICAL", "URGENT"),
    ("Park sprinkler system pipe cracked and flooding flower beds while lawns dry out.", "Parks & Environment", "LOW", "LOW"),
    ("Playground slide has cracked plastic edges cutting children hands.", "Parks & Environment", "HIGH", "HIGH"),
    ("Dried dead tree branches about to fall on walking trail walkers.", "Parks & Environment", "HIGH", "HIGH"),
    ("Littering of plastic covers and liquor bottles in municipal botanical garden.", "Parks & Environment", "LOW", "LOW"),
    ("Solar lights installed in community park stolen or damaged.", "Parks & Environment", "LOW", "LOW"),
    ("Encroachment of public green belt park by unauthorized commercial nursery.", "Parks & Environment", "MEDIUM", "MEDIUM"),

    # Other
    ("Civic helpline telephone number 103 continuously disconnected or engaged.", "Other", "MEDIUM", "MEDIUM"),
    ("Name board of public memorial park vandalized with offensive paint.", "Other", "LOW", "LOW"),
    ("Noise pollution from loud industrial generator running in quiet residential zone all night.", "Other", "HIGH", "HIGH"),
    ("Unauthorized religious structure erected blocking public pedestrian easement.", "Other", "MEDIUM", "MEDIUM"),
    ("Property tax receipt portal showing server timeout error for three days.", "Other", "LOW", "LOW"),
    ("Municipal ward office staff demanding bribe for issuing birth certificate.", "Other", "HIGH", "HIGH"),
    ("Community hall AC units leaking water on electrical distribution panel.", "Other", "HIGH", "HIGH"),
    ("Notice board glass broken and official notices torn down by vandals.", "Other", "LOW", "LOW"),
    ("Dog licensing counter at zonal office closed during advertised public hours.", "Other", "LOW", "LOW"),
    ("Unauthorized commercial banners tied across public overhead pedestrian footbridge.", "Other", "LOW", "LOW")
]

# Variations and augmentation to expand into a rich ~600+ record dataset covering realistic patterns
LOCATION_PHRASES = [
    "near the main market", "at cross road 4", "behind the bus terminal",
    "in front of the government school", "near the metro station",
    "on ring road sector 9", "outside the civil hospital", "near railway gate",
    "at the community center", "in our housing society lane"
]

ADDITIONAL_SYNONYMS = {
    "Roads & Infrastructure": [
        ("Huge crater in the road causing vehicle damage", "HIGH", "HIGH"),
        ("Asphalt road completely broken and eroded after heavy rain", "HIGH", "HIGH"),
        ("Dangerous pothole near school gate vehicles almost crashing", "HIGH", "HIGH"),
        ("Bridge slab cracked and vibrating when heavy vehicles cross", "CRITICAL", "URGENT"),
        ("Underpass road inundated with 3 feet water due to surface depression", "HIGH", "HIGH"),
        ("Sidewalk tiles loose and causing pedestrians to stumble", "LOW", "LOW"),
        ("Road divider missing reflectors causing night time crashes", "MEDIUM", "HIGH"),
        ("Excavation work by telecom company left open without warning signs", "CRITICAL", "URGENT"),
        ("Speed bump damaged and sharp metal rods protruding upward", "HIGH", "HIGH"),
        ("Road caved in near water pipe joint creating a large hole", "CRITICAL", "URGENT")
    ],
    "Water Supply": [
        ("Yellowish dirty water with foul stench flowing from kitchen taps", "CRITICAL", "URGENT"),
        ("Drinking water pipeline ruptured on 5th avenue water wastage", "HIGH", "HIGH"),
        ("No water supply for four consecutive days in entire colony", "HIGH", "HIGH"),
        ("Very low pressure water cannot reach overhead storage tanks", "MEDIUM", "MEDIUM"),
        ("Sewage pipeline leaking directly into drinking water line", "CRITICAL", "URGENT"),
        ("Water distribution valve jammed open causing flood on street", "MEDIUM", "MEDIUM"),
        ("Muddy brown water coming from municipal water tap", "HIGH", "HIGH"),
        ("Underground water supply pipe leaking under road pavement", "MEDIUM", "MEDIUM"),
        ("Public drinking water fountain broken and stagnant", "LOW", "LOW"),
        ("Main water pump burned out leaving thousand households dry", "CRITICAL", "URGENT")
    ],
    "Electricity": [
        ("Exposed electrical wire hanging on pedestrian walkway shock danger", "CRITICAL", "URGENT"),
        ("Transformer explosion occurred with sparks falling on parked cars", "CRITICAL", "URGENT"),
        ("Power outage for past 14 hours in 40 degree heat wave", "HIGH", "HIGH"),
        ("Electric pole bent at 45 degree angle after tractor hit it", "CRITICAL", "URGENT"),
        ("Sparks flying from feeder pillar whenever it rains", "HIGH", "HIGH"),
        ("Severe power fluctuation damaging refrigerator and computer", "HIGH", "HIGH"),
        ("Electric meter box door open with bare wires accessible to children", "CRITICAL", "URGENT"),
        ("High voltage wire touching tree branches causing flashover fires", "CRITICAL", "URGENT"),
        ("Unscheduled load shedding occurring multiple times every day", "MEDIUM", "MEDIUM"),
        ("Fallen power line across highway road blocking all traffic", "CRITICAL", "URGENT")
    ],
    "Sanitation": [
        ("Community toilet choked and raw sewage overflowing in street", "CRITICAL", "HIGH"),
        ("Unbearable stench from open urinal right outside primary school", "HIGH", "HIGH"),
        ("Public latrine without running water and completely filthy condition", "MEDIUM", "MEDIUM"),
        ("Slaughterhouse dumping raw animal entrails into open roadside gutter", "CRITICAL", "URGENT"),
        ("Biohazard waste including syringes dumped in public alleyway", "CRITICAL", "URGENT"),
        ("Open defecation taking place near slum border due to locked toilets", "HIGH", "HIGH"),
        ("Drainage backflow into residential ground floor courtyards", "CRITICAL", "URGENT"),
        ("Meat shop disposing chicken feathers and blood in municipal gutter", "HIGH", "HIGH"),
        ("Public toilet ceiling leaking filthy wastewater on visitors", "HIGH", "HIGH"),
        ("Sanitary disposal bin broken and contents scattered on ground", "LOW", "LOW")
    ],
    "Waste Management": [
        ("Garbage has not been lifted for 10 days pile is rotting", "HIGH", "HIGH"),
        ("Community garbage dumper overflowing on road attracting stray animals", "HIGH", "HIGH"),
        ("Open burning of plastic and rubber trash creating suffocating smoke", "CRITICAL", "URGENT"),
        ("Sanitation truck skips our street regularly during morning rounds", "MEDIUM", "MEDIUM"),
        ("Dumping of construction rubble on footpaths forcing walkers onto road", "MEDIUM", "MEDIUM"),
        ("Rotting dead animal lying unattended for two days creating biohazard", "CRITICAL", "URGENT"),
        ("Garbage bin overturned by stray cows waste scattered everywhere", "MEDIUM", "MEDIUM"),
        ("Commercial market dumping cartons and spoiled food on roadside", "MEDIUM", "MEDIUM"),
        ("Toxic chemical containers abandoned on vacant municipal land", "CRITICAL", "URGENT"),
        ("Plastic bags and litter blowing across neighborhood from unmanaged dump", "LOW", "LOW")
    ],
    "Drainage": [
        ("Open manhole on busy road with no barricade or warning sign", "CRITICAL", "URGENT"),
        ("Stormwater drain completely blocked waterlogging road up to two feet", "HIGH", "HIGH"),
        ("Concrete slab over drainage canal collapsed someone could fall in", "CRITICAL", "URGENT"),
        ("Sewage pipeline burst spilling black waste water over main junction", "CRITICAL", "URGENT"),
        ("Underground drain choked causing foul water to back up into houses", "HIGH", "HIGH"),
        ("Monsoon rainwater cannot drain because silt covers all entry grates", "HIGH", "HIGH"),
        ("Open sewer emitting toxic gases causing headaches and coughing", "HIGH", "HIGH"),
        ("Drainage ditch overflowing into vegetable market after brief rain", "HIGH", "HIGH"),
        ("Loose manhole cover making loud banging noise whenever vehicles pass", "LOW", "LOW"),
        ("Rainwater drain pipe broken and dumping water onto pedestrian bridge", "MEDIUM", "MEDIUM")
    ],
    "Public Safety": [
        ("Feral aggressive dogs chasing scooters and biting pedestrians", "HIGH", "HIGH"),
        ("Deep unprotected trench dug near playground kids playing nearby", "CRITICAL", "URGENT"),
        ("Old dilapidated municipal wall tilting towards public footpath", "CRITICAL", "URGENT"),
        ("No safety fencing along deep quarry pit near residential colony", "CRITICAL", "URGENT"),
        ("Unsocial elements gambling and drinking liquor in public subway", "HIGH", "HIGH"),
        ("Massive advertising billboard loose and swinging in thunderstorm", "CRITICAL", "URGENT"),
        ("Fire escape door locked in public commercial shopping complex", "CRITICAL", "URGENT"),
        ("Stray cattle wandering on dark expressway causing fatal vehicle crashes", "CRITICAL", "URGENT"),
        ("Overhanging dead tree limb ready to crash down on passing vehicles", "HIGH", "HIGH"),
        ("Broken handrail on high pedestrian foot overbridge above tracks", "HIGH", "HIGH")
    ],
    "Street Lighting": [
        ("All streetlights out for 2 kilometers pitch dark road unsafe for women", "HIGH", "HIGH"),
        ("Streetlight electric pole damaged with live wires exposed on sidewalk", "CRITICAL", "URGENT"),
        ("Street lamp flickering constantly causing disorientation at night", "LOW", "LOW"),
        ("Streetlights turned on in broad daylight wasting public power", "LOW", "LOW"),
        ("Dark alleyway near girls hostel where streetlights have been burnt out", "HIGH", "HIGH"),
        ("Underpass illumination completely dead driving through is hazardous", "HIGH", "HIGH"),
        ("Rusted lamp post leaning heavily over parked cars and footpath", "HIGH", "HIGH"),
        ("Streetlight timer broken lights turn on after midnight only", "MEDIUM", "MEDIUM"),
        ("Dense tree leaves covering street lights road remains completely dark", "MEDIUM", "MEDIUM"),
        ("High mast LED floodlights in bus terminus stopped working", "MEDIUM", "HIGH")
    ],
    "Traffic": [
        ("Traffic signal non functional at major intersection four way gridlock", "HIGH", "HIGH"),
        ("Signal stuck on green both sides causing vehicles to collide", "CRITICAL", "URGENT"),
        ("Illegal truck parking on both sides of two lane road blocking traffic", "MEDIUM", "MEDIUM"),
        ("Missing STOP sign and blind curve warning at dangerous crossroads", "HIGH", "HIGH"),
        ("Heavy vehicles speeding through school zone during morning hours", "HIGH", "HIGH"),
        ("Wrong side driving on highway exit ramp creating fatal hazard", "CRITICAL", "URGENT"),
        ("Buses stopping in middle of road instead of designated bus bays", "MEDIUM", "MEDIUM"),
        ("Pedestrian crossing light broken people unable to cross six lane road", "HIGH", "HIGH"),
        ("Accident vehicles left stranded in fast lane causing 5km traffic jam", "HIGH", "HIGH"),
        ("Traffic direction arrow signage misleading drivers into wrong way street", "MEDIUM", "HIGH")
    ],
    "Public Health": [
        ("Outbreak of malaria and dengue due to stagnant puddle in vacant ground", "CRITICAL", "URGENT"),
        ("Mosquito breeding heavy in open drain municipal fogging needed urgently", "HIGH", "HIGH"),
        ("Contaminated drinking water causing gastro illness among children", "CRITICAL", "URGENT"),
        ("Rabid dog bitten several people on market street needs animal control", "CRITICAL", "URGENT"),
        ("Rotting meat and dead birds disposed in open lot creating infection risk", "CRITICAL", "URGENT"),
        ("Hospital clinic lacks basic tetanus injections and snake antivenom", "CRITICAL", "URGENT"),
        ("Roadside food stalls washing plates in filthy drain water", "HIGH", "HIGH"),
        ("Chemical fumes from unlicensed battery workshop causing breathing issues", "HIGH", "HIGH"),
        ("Stagnant water in park fountain turned into mosquito nursery", "MEDIUM", "MEDIUM"),
        ("Public water cooler filters dirty and dispensing contaminated water", "MEDIUM", "HIGH")
    ],
    "Parks & Environment": [
        ("Fallen tree branch crushing children play swings in colony park", "HIGH", "HIGH"),
        ("Large dead tree about to fall onto walking path in public garden", "HIGH", "HIGH"),
        ("Lake water turning green with chemical pollution and foul smell", "CRITICAL", "URGENT"),
        ("Children slide broken with exposed rusted iron nails in play area", "HIGH", "HIGH"),
        ("Unauthorized chopping of shade trees along municipal avenue", "HIGH", "HIGH"),
        ("Park lights smashed and broken beer bottles littered on grass", "MEDIUM", "MEDIUM"),
        ("Park boundary fence broken stray dogs and pigs roaming inside", "MEDIUM", "MEDIUM"),
        ("Jogging track paving broken and muddy after rain", "LOW", "LOW"),
        ("Water fountain pump burnt out water turned into dirty slime", "LOW", "LOW"),
        ("Encroachment of public green park by private car parking", "MEDIUM", "MEDIUM")
    ],
    "Other": [
        ("Civic complaint helpline number not being answered for days", "MEDIUM", "MEDIUM"),
        ("Loud commercial speakers blasting past midnight in residential area", "HIGH", "HIGH"),
        ("Municipal staff demanding cash bribe for birth and death certificates", "HIGH", "HIGH"),
        ("Community library ceiling leaking water over books and wiring", "HIGH", "HIGH"),
        ("Public monument defaced with spray paint and posters", "LOW", "LOW"),
        ("Municipal office premises full of uncleaned cobwebs and broken chairs", "LOW", "LOW"),
        ("Unauthorized advertising flex banners obstructing road view", "LOW", "LOW"),
        ("Citizen facilitation center token system down causing long queues", "MEDIUM", "MEDIUM"),
        ("Noise pollution from banquet hall fireworks late at night", "MEDIUM", "MEDIUM"),
        ("Public bulletin board glass shattered on sidewalk", "LOW", "LOW")
    ]
}

def generate_dataset():
    records = []
    
    # Add raw base dataset
    for text, dept, sev, pri in RAW_DATA:
        records.append({
            "complaint": text,
            "department": dept,
            "severity": sev,
            "priority": pri
        })
    
    # Add synonyms and variations
    for dept, items in ADDITIONAL_SYNONYMS.items():
        for text, sev, pri in items:
            records.append({
                "complaint": text,
                "department": dept,
                "severity": sev,
                "priority": pri
            })
            # Add location variation
            for loc in LOCATION_PHRASES[:3]:
                records.append({
                    "complaint": f"{text} {loc}.",
                    "department": dept,
                    "severity": sev,
                    "priority": pri
                })
    
    # Write to CSV
    with open(CSV_PATH, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["complaint", "department", "severity", "priority"])
        writer.writeheader()
        for r in records:
            writer.writerow(r)
            
    print(f"Generated {len(records)} realistic civic complaint training records in {CSV_PATH}")

if __name__ == "__main__":
    generate_dataset()

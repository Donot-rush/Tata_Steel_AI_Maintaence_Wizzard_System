"""Seed data for the Maintenance Wizard — Tata Steel AI Platform (30 assets)."""
from datetime import datetime, timezone, timedelta
import random
import uuid

UTC = timezone.utc


def _id():
    return str(uuid.uuid4())


def _iso(dt):
    return dt.isoformat()


# 30 steel-plant assets across 6 production sectors.
ASSETS = [
    # --- Blast Furnace (5) ---
    {"id": "ast-bfurn-02", "code": "BF-02", "name": "Blast Furnace #2", "category": "Furnace",
     "sector": "Blast Furnace", "location": "Iron-making Plant",
     "criticality": "critical", "manufacturer": "Paul Wurth", "model": "BF-4500", "installed": "2010-03-22"},
    {"id": "ast-bfurn-03", "code": "BF-03", "name": "Blast Furnace #3", "category": "Furnace",
     "sector": "Blast Furnace", "location": "Iron-making Plant",
     "criticality": "critical", "manufacturer": "Paul Wurth", "model": "BF-4500", "installed": "2012-09-18"},
    {"id": "ast-hbb-01",  "code": "HBB-01", "name": "Hot Blast Blower", "category": "Hydraulic Pump",
     "sector": "Blast Furnace", "location": "BF Stoves",
     "criticality": "critical", "manufacturer": "Siemens", "model": "HBB-9000", "installed": "2011-07-30"},
    {"id": "ast-bfc-01",  "code": "BFC-01", "name": "BF Cooling Pump #1", "category": "Cooling System",
     "sector": "Blast Furnace", "location": "Cooling Stack",
     "criticality": "high", "manufacturer": "KSB", "model": "Etanorm 200", "installed": "2015-04-12"},
    {"id": "ast-bfh-01",  "code": "BFH-01", "name": "BF Hydraulic System", "category": "Hydraulic Pump",
     "sector": "Blast Furnace", "location": "Tap-Hole Area",
     "criticality": "high", "manufacturer": "Bosch Rexroth", "model": "HPU-A4VG", "installed": "2014-11-08"},

    # --- Steel Melting Shop (5) ---
    {"id": "ast-cooler-03", "code": "CC-03", "name": "Continuous Caster Cooler CC-03", "category": "Cooling System",
     "sector": "Steel Melting Shop", "location": "Continuous Casting Line",
     "criticality": "high", "manufacturer": "Danieli", "model": "QuickCool 2X", "installed": "2018-05-17"},
    {"id": "ast-crane-05", "code": "LC-05", "name": "Ladle Transfer Crane LC-05", "category": "Crane",
     "sector": "Steel Melting Shop", "location": "Steel-Melt Shop",
     "criticality": "medium", "manufacturer": "Konecranes", "model": "SMARTON 320T", "installed": "2015-12-01"},
    {"id": "ast-ldc-01",  "code": "LDC-01", "name": "LD Converter Vessel #1", "category": "Furnace",
     "sector": "Steel Melting Shop", "location": "BOF Shop",
     "criticality": "critical", "manufacturer": "SMS Group", "model": "LD-320", "installed": "2013-02-14"},
    {"id": "ast-lf-01",   "code": "LF-01",  "name": "Ladle Furnace", "category": "Furnace",
     "sector": "Steel Melting Shop", "location": "Secondary Metallurgy",
     "criticality": "high", "manufacturer": "Danieli", "model": "LF-220", "installed": "2014-06-25"},
    {"id": "ast-ccst-01", "code": "CCST-01","name": "Continuous Caster #1", "category": "Caster",
     "sector": "Steel Melting Shop", "location": "Casting Bay",
     "criticality": "critical", "manufacturer": "SMS Concast", "model": "CCS-Slab-1", "installed": "2016-08-03"},

    # --- Rolling Mill (5) ---
    {"id": "ast-rmill-01", "code": "HRM-01", "name": "Hot Rolling Mill #1", "category": "Rolling Mill",
     "sector": "Rolling Mill", "location": "Bay A — Hot Strip Line",
     "criticality": "critical", "manufacturer": "SMS Group", "model": "CVC-Plus 2050", "installed": "2014-06-12"},
    {"id": "ast-hpump-04", "code": "HP-04", "name": "Hydraulic Pump HP-04", "category": "Hydraulic Pump",
     "sector": "Rolling Mill", "location": "Rolling Mill Hydraulics",
     "criticality": "high", "manufacturer": "Bosch Rexroth", "model": "A4VSO-355", "installed": "2019-08-14"},
    {"id": "ast-gbox-09", "code": "GB-09", "name": "Reducer Gearbox GB-09", "category": "Gearbox",
     "sector": "Rolling Mill", "location": "Finishing Stand F5",
     "criticality": "medium", "manufacturer": "Flender", "model": "B4SH-13", "installed": "2016-02-09"},
    {"id": "ast-mot-12", "code": "MD-12", "name": "Main Drive Motor MD-12", "category": "Motor",
     "sector": "Rolling Mill", "location": "Roughing Mill",
     "criticality": "critical", "manufacturer": "ABB", "model": "AMA 800L4L", "installed": "2013-09-30"},
    {"id": "ast-fsf-01", "code": "FSF-01", "name": "Finishing Stand F1", "category": "Rolling Mill",
     "sector": "Rolling Mill", "location": "Finishing Train",
     "criticality": "high", "manufacturer": "SMS Group", "model": "FSF-CVC", "installed": "2017-03-19"},

    # --- Coke Oven (5) ---
    {"id": "ast-conv-07", "code": "CONV-07", "name": "Coke Conveyor C-07", "category": "Conveyor",
     "sector": "Coke Oven", "location": "Coke Oven Battery 3",
     "criticality": "high", "manufacturer": "FLSmidth", "model": "BeltLine 1200", "installed": "2017-11-04"},
    {"id": "ast-cob-04", "code": "COB-04", "name": "Coke Oven Battery #4", "category": "Furnace",
     "sector": "Coke Oven", "location": "Coke Plant",
     "criticality": "critical", "manufacturer": "Uhde", "model": "COB-65", "installed": "2009-10-22"},
    {"id": "ast-pca-01", "code": "PCA-01", "name": "Pusher Car #1", "category": "Vehicle",
     "sector": "Coke Oven", "location": "Coke Side",
     "criticality": "medium", "manufacturer": "Otto", "model": "PC-Pusher-XL", "installed": "2015-05-11"},
    {"id": "ast-door-12","code": "DOOR-12","name": "Door Cleaning Machine", "category": "Robotics",
     "sector": "Coke Oven", "location": "Door Service",
     "criticality": "low", "manufacturer": "SMS Maerz", "model": "DCM-A2", "installed": "2020-01-15"},
    {"id": "ast-qcar-01","code": "QCAR-01","name": "Quench Car #1", "category": "Vehicle",
     "sector": "Coke Oven", "location": "Quench Tower",
     "criticality": "high", "manufacturer": "Otto", "model": "QC-Tower-2", "installed": "2014-08-08"},

    # --- Sinter Plant (5) ---
    {"id": "ast-sint-01","code": "SINT-01","name": "Sintering Strand #1", "category": "Conveyor",
     "sector": "Sinter Plant", "location": "Sinter Bay",
     "criticality": "critical", "manufacturer": "Outotec", "model": "SS-440", "installed": "2011-06-14"},
    {"id": "ast-scl-01", "code": "SCL-01", "name": "Sinter Cooler", "category": "Cooling System",
     "sector": "Sinter Plant", "location": "Cooler Bay",
     "criticality": "high", "manufacturer": "Outotec", "model": "CIR-440", "installed": "2011-06-14"},
    {"id": "ast-crsh-01","code": "CRSH-01","name": "Primary Crusher", "category": "Crusher",
     "sector": "Sinter Plant", "location": "Raw Yard",
     "criticality": "high", "manufacturer": "Metso", "model": "Lokotrack LT110", "installed": "2018-09-22"},
    {"id": "ast-dedu-01","code": "DEDU-01","name": "Dedusting Fan", "category": "Fan",
     "sector": "Sinter Plant", "location": "Stack Side",
     "criticality": "medium", "manufacturer": "Howden", "model": "FRD-130", "installed": "2019-03-08"},
    {"id": "ast-mixt-01","code": "MIXT-01","name": "Mixing Drum", "category": "Conveyor",
     "sector": "Sinter Plant", "location": "Sinter Mixer",
     "criticality": "medium", "manufacturer": "FLSmidth", "model": "DRM-12", "installed": "2017-12-01"},

    # --- Power Plant (3) ---
    {"id": "ast-turb-01","code": "TURB-01","name": "Steam Turbine Generator", "category": "Turbine",
     "sector": "Power Plant", "location": "Captive Power",
     "criticality": "critical", "manufacturer": "Siemens", "model": "SST-700", "installed": "2012-03-04"},
    {"id": "ast-boil-01","code": "BOIL-01","name": "Steam Boiler #1", "category": "Boiler",
     "sector": "Power Plant", "location": "CPP Boiler Hall",
     "criticality": "critical", "manufacturer": "BHEL", "model": "BB-150", "installed": "2012-03-04"},
    {"id": "ast-comp-01","code": "COMP-01","name": "Air Compressor", "category": "Compressor",
     "sector": "Power Plant", "location": "Utilities",
     "criticality": "high", "manufacturer": "Atlas Copco", "model": "ZH-15000", "installed": "2018-11-19"},

    # --- Utilities / Cross-cutting (2) ---
    {"id": "ast-helg-01","code": "HELG-01","name": "Helical Gearbox HG-01", "category": "Gearbox",
     "sector": "Rolling Mill", "location": "Coiler Drive",
     "criticality": "medium", "manufacturer": "Flender", "model": "HEL-Compact-9", "installed": "2019-05-21"},
    {"id": "ast-tbl-01", "code": "TBL-01", "name": "Turbo Blower TB-01", "category": "Hydraulic Pump",
     "sector": "Blast Furnace", "location": "Blower Hall",
     "criticality": "high", "manufacturer": "Siemens", "model": "Turbo-AC-7", "installed": "2016-09-10"},
]

# Health/RUL/status state per asset — designed to span the spectrum.
_STATE = {
    "ast-rmill-01": (64, 32, "warning"),
    "ast-bfurn-02": (78, 96, "healthy"),
    "ast-conv-07":  (41, 12, "critical"),
    "ast-hpump-04": (58, 22, "warning"),
    "ast-gbox-09":  (82, 140, "healthy"),
    "ast-mot-12":   (36, 8,  "critical"),
    "ast-cooler-03":(71, 60, "healthy"),
    "ast-crane-05": (88, 210, "healthy"),
    # New
    "ast-bfurn-03": (84, 180, "healthy"),
    "ast-hbb-01":   (62, 45, "warning"),
    "ast-bfc-01":   (47, 18, "critical"),
    "ast-bfh-01":   (75, 90, "healthy"),
    "ast-ldc-01":   (54, 28, "warning"),
    "ast-lf-01":    (81, 160, "healthy"),
    "ast-ccst-01":  (69, 70, "healthy"),
    "ast-fsf-01":   (52, 25, "warning"),
    "ast-cob-04":   (38, 10, "critical"),
    "ast-pca-01":   (86, 195, "healthy"),
    "ast-door-12":  (92, 260, "healthy"),
    "ast-qcar-01":  (66, 55, "warning"),
    "ast-sint-01":  (44, 14, "critical"),
    "ast-scl-01":   (73, 85, "healthy"),
    "ast-crsh-01":  (61, 40, "warning"),
    "ast-dedu-01":  (89, 230, "healthy"),
    "ast-mixt-01":  (77, 110, "healthy"),
    "ast-turb-01":  (33, 6,  "critical"),
    "ast-boil-01":  (79, 130, "healthy"),
    "ast-comp-01":  (68, 50, "warning"),
    "ast-helg-01":  (85, 200, "healthy"),
    "ast-tbl-01":   (56, 30, "warning"),
}


def build_assets():
    out = []
    for a in ASSETS:
        h, rul, status = _STATE.get(a["id"], (75, 90, "healthy"))
        out.append({**a, "health": h, "rul_days": rul, "status": status,
                    "updated_at": _iso(datetime.now(UTC))})
    return out


def _gen_series(base, noise, drift=0.0, n=60):
    series = []
    now = datetime.now(UTC)
    val = base
    for i in range(n):
        t = now - timedelta(minutes=(n - i) * 5)
        val = base + drift * i + random.uniform(-noise, noise)
        series.append({"t": _iso(t), "v": round(val, 2)})
    return series


# Default sensor profiles by category
_CATEGORY_PROFILES = {
    "Rolling Mill":   dict(vib=(6.2, 0.6, 0.04), temp=(78, 3, 0.05),  pres=(165, 4, 0.0), cur=(420, 12, 0.1)),
    "Furnace":        dict(vib=(2.1, 0.3, 0.0),  temp=(1280, 18, 0.0),pres=(2.4, 0.2, 0.0),cur=(890, 25, 0.0)),
    "Conveyor":       dict(vib=(9.8, 0.9, 0.08), temp=(62, 5, 0.06),  pres=(0, 0, 0),     cur=(135, 8, 0.05)),
    "Hydraulic Pump": dict(vib=(5.4, 0.5, 0.03), temp=(72, 3, 0.02),  pres=(245, 8, -0.08),cur=(180, 6, 0.0)),
    "Gearbox":        dict(vib=(3.2, 0.4, 0.0),  temp=(65, 2, 0.0),   pres=(0, 0, 0),     cur=(210, 9, 0.0)),
    "Motor":          dict(vib=(11.2, 1.2, 0.1), temp=(96, 4, 0.08),  pres=(0, 0, 0),     cur=(1240, 35, 0.15)),
    "Cooling System": dict(vib=(2.8, 0.4, 0.0),  temp=(38, 2, 0.0),   pres=(3.6, 0.2, 0.0),cur=(310, 10, 0.0)),
    "Crane":          dict(vib=(1.9, 0.3, 0.0),  temp=(48, 2, 0.0),   pres=(0, 0, 0),     cur=(420, 14, 0.0)),
    "Caster":         dict(vib=(3.6, 0.4, 0.0),  temp=(420, 12, 0.0), pres=(85, 3, 0.0),  cur=(540, 16, 0.0)),
    "Vehicle":        dict(vib=(7.0, 0.7, 0.0),  temp=(80, 4, 0.0),   pres=(0, 0, 0),     cur=(150, 9, 0.0)),
    "Robotics":       dict(vib=(2.4, 0.3, 0.0),  temp=(55, 2, 0.0),   pres=(0, 0, 0),     cur=(85, 4, 0.0)),
    "Turbine":        dict(vib=(8.5, 0.8, 0.05), temp=(530, 14, 0.05),pres=(190, 6, 0.0), cur=(2150, 60, 0.0)),
    "Boiler":         dict(vib=(2.6, 0.3, 0.0),  temp=(560, 14, 0.0), pres=(85, 4, 0.0),  cur=(180, 8, 0.0)),
    "Compressor":     dict(vib=(4.8, 0.5, 0.0),  temp=(72, 3, 0.0),   pres=(13.5, 0.5, 0.0),cur=(620, 18, 0.0)),
    "Crusher":        dict(vib=(12.4,1.4, 0.08), temp=(58, 4, 0.0),   pres=(0, 0, 0),     cur=(880, 28, 0.0)),
    "Fan":            dict(vib=(3.4, 0.4, 0.0),  temp=(75, 3, 0.0),   pres=(0, 0, 0),     cur=(260, 10, 0.0)),
}

# Per-asset overrides (preserves original 8 behaviour exactly)
_ASSET_PROFILES = {
    "ast-rmill-01": _CATEGORY_PROFILES["Rolling Mill"],
    "ast-bfurn-02": _CATEGORY_PROFILES["Furnace"],
    "ast-conv-07":  _CATEGORY_PROFILES["Conveyor"],
    "ast-hpump-04": _CATEGORY_PROFILES["Hydraulic Pump"],
    "ast-gbox-09":  _CATEGORY_PROFILES["Gearbox"],
    "ast-mot-12":   _CATEGORY_PROFILES["Motor"],
    "ast-cooler-03":_CATEGORY_PROFILES["Cooling System"],
    "ast-crane-05": _CATEGORY_PROFILES["Crane"],
}


def _profile_for(asset_id):
    if asset_id in _ASSET_PROFILES:
        return _ASSET_PROFILES[asset_id]
    a = next((x for x in ASSETS if x["id"] == asset_id), None)
    if a:
        return _CATEGORY_PROFILES.get(a["category"], _CATEGORY_PROFILES["Motor"])
    return _CATEGORY_PROFILES["Motor"]


def build_sensor_series(asset_id):
    p = _profile_for(asset_id)
    return {
        "vibration": _gen_series(*p["vib"]),
        "temperature": _gen_series(*p["temp"]),
        "pressure": _gen_series(*p["pres"]) if p["pres"][0] else [],
        "current": _gen_series(*p["cur"]),
    }


def live_tick(asset_id):
    """Single-step sample for WebSocket streaming."""
    p = _profile_for(asset_id)
    def one(t):
        b, n, _drift = t
        return round(b + random.uniform(-n, n), 2) if b else None
    return {
        "vibration": one(p["vib"]),
        "temperature": one(p["temp"]),
        "pressure": one(p["pres"]) if p["pres"][0] else None,
        "current": one(p["cur"]),
    }


def build_alerts():
    now = datetime.now(UTC)
    alerts = [
        # Original 5
        {"asset_id": "ast-mot-12", "severity": "critical",
         "title": "Vibration exceeds threshold (RMS 11.2 mm/s)",
         "message": "Sustained over 4h. Probable bearing degradation on DE side.",
         "evidence": ["sensor:vibration", "log:fault-E2317", "history:bearing-replacement-2024"],
         "delta": timedelta(minutes=18), "ack": False},
        {"asset_id": "ast-conv-07", "severity": "critical",
         "title": "Belt misalignment detected", "message": "Drift +12mm vs nominal.",
         "evidence": ["sensor:vibration", "process:tracking-sensor"],
         "delta": timedelta(hours=1, minutes=12), "ack": False},
        {"asset_id": "ast-rmill-01", "severity": "warning",
         "title": "Roll-gap deviation trending up",
         "message": "Gap variance +0.08mm over last shift.",
         "evidence": ["process:gap-sensor", "sop:RM-INSP-12"],
         "delta": timedelta(hours=3), "ack": False},
        {"asset_id": "ast-hpump-04", "severity": "warning",
         "title": "Pressure dropping 3.2% / hr",
         "message": "Possible internal leakage. Check seal kit P/N 2207-K.",
         "evidence": ["sensor:pressure", "manual:HP-04-SEC-7.3"],
         "delta": timedelta(hours=5, minutes=22), "ack": True},
        {"asset_id": "ast-bfurn-02", "severity": "info",
         "title": "Tuyere temperature variance",
         "message": "Tuyere #14 running +35°C vs avg.",
         "evidence": ["sensor:temperature"],
         "delta": timedelta(hours=7), "ack": True},
        # New 8 — across new assets
        {"asset_id": "ast-bfc-01", "severity": "critical",
         "title": "Cooling pump flow rate dropping",
         "message": "Flow rate down 15% in 2h — risk to BF stave cooling.",
         "evidence": ["sensor:flow", "sop:BF-COOL-09"],
         "delta": timedelta(minutes=42), "ack": False},
        {"asset_id": "ast-cob-04", "severity": "critical",
         "title": "Battery wall temperature spike",
         "message": "Refractory degradation suspected at battery #4.",
         "evidence": ["sensor:temperature", "manual:COB-WALL-04"],
         "delta": timedelta(hours=2, minutes=10), "ack": False},
        {"asset_id": "ast-sint-01", "severity": "critical",
         "title": "Strand pallet bearing failure",
         "message": "Detected on pallet 14 — replace before next shift.",
         "evidence": ["sensor:vibration", "log:fault-S511"],
         "delta": timedelta(hours=4), "ack": False},
        {"asset_id": "ast-turb-01", "severity": "critical",
         "title": "Turbine vibration trip threshold",
         "message": "Imminent shutdown risk. Power-plant supervisor notified.",
         "evidence": ["sensor:vibration", "sop:CPP-EM-01"],
         "delta": timedelta(hours=6), "ack": False},
        {"asset_id": "ast-ldc-01", "severity": "warning",
         "title": "Vessel tilt drive current high",
         "message": "Hydraulic resistance increasing in tilt mechanism.",
         "evidence": ["sensor:current", "manual:LDC-TILT-02"],
         "delta": timedelta(hours=8), "ack": False},
        {"asset_id": "ast-fsf-01", "severity": "warning",
         "title": "Stand load cell anomaly",
         "message": "Load-cell drift 4% — recalibrate.",
         "evidence": ["sensor:load"],
         "delta": timedelta(hours=10), "ack": False},
        {"asset_id": "ast-comp-01", "severity": "warning",
         "title": "Air receiver pressure cycling",
         "message": "Short-cycling detected — check unloader valve.",
         "evidence": ["sensor:pressure"],
         "delta": timedelta(hours=14), "ack": False},
        {"asset_id": "ast-hbb-01", "severity": "warning",
         "title": "Blower stage 2 efficiency dropping",
         "message": "Polytropic efficiency -3% vs baseline.",
         "evidence": ["sensor:efficiency", "manual:HBB-PERF-1"],
         "delta": timedelta(hours=18), "ack": True},
    ]
    out = []
    for a in alerts:
        ast = next((x for x in ASSETS if x["id"] == a["asset_id"]), None)
        if not ast: continue
        out.append({
            "id": _id(), "asset_id": a["asset_id"], "asset_name": ast["name"],
            "severity": a["severity"], "title": a["title"], "message": a["message"],
            "created_at": _iso(now - a["delta"]), "acknowledged": a["ack"],
            "evidence": a["evidence"],
        })
    return out


def build_logbook():
    now = datetime.now(UTC)
    entries = [
        ("ast-mot-12", "Lubrication top-up — DE bearing", 25, ["Grease NLGI-2 — 150g"],
         "Vibration baseline reduced from 11.6 to 11.2 RMS post lubrication.", 2),
        ("ast-conv-07", "Belt tracking adjustment — head pulley", 45, [],
         "Realigned scraper. Tracking drift reduced to +4mm.", 4),
        ("ast-hpump-04", "Replaced shaft seal kit P/N 2207-K", 180,
         ["Seal Kit 2207-K x1", "Hydraulic oil ISO VG46 — 12L"],
         "Pressure restored to 245 bar nominal.", 18),
        ("ast-bfc-01", "Impeller inspection — minor erosion noted", 90, [],
         "Schedule replacement in next shutdown.", 12),
        ("ast-turb-01", "Bearing oil flush + lab sample sent", 120, ["ISO VG32 — 80L"],
         "Particle count elevated; awaiting tribology report.", 22),
        ("ast-sint-01", "Pallet 11 wheel replacement", 240, ["SKF 6230 x2"],
         "Restored strand speed to 2.4 m/min.", 26),
    ]
    out = []
    for asset_id, action, duration, spares, notes, days_ago in entries:
        ast = next((x for x in ASSETS if x["id"] == asset_id), None)
        if not ast: continue
        out.append({
            "id": _id(), "asset_id": asset_id, "asset_name": ast["name"],
            "action": action, "performed_by": "Auto-Logger", "duration_min": duration,
            "spares_used": spares, "notes": notes,
            "created_at": _iso(now - timedelta(days=days_ago)),
        })
    return out


def build_knowledge():
    docs = [
        ("ast-mot-12", "manual", "ABB AMA 800L4L — Section 4.2 Bearing Inspection",
         "Bearing condition is assessed via vibration RMS (ISO 10816-3). Zone A < 4.5 mm/s, "
         "Zone B 4.5–7.1 mm/s, Zone C 7.1–11.0 mm/s, Zone D > 11.0 mm/s = damage imminent. "
         "DE bearing is SKF 6324 C3, lubricated with Mobilith SHC 100 at 80g / 1500 hours."),
        ("ast-mot-12", "sop", "SOP MD-12-INSP-07 — Emergency Bearing Inspection",
         "1. Isolate motor + LOTO. 2. Remove DE bearing cover. 3. Inspect for spalling. "
         "4. Measure axial play (>0.4mm = replace). P/N SKF 6324 C3 (Bin C-14)."),
        ("ast-conv-07", "manual", "FLSmidth BeltLine 1200 — Tracking Adjustment",
         "Belt drift >8mm requires immediate adjustment. Adjust head-pulley 1/8 turn at a time."),
        ("ast-rmill-01", "sop", "SOP RM-INSP-12 — Roll-gap calibration",
         "Recalibrate roll-gap sensors at every shift change. Acceptable variance: ±0.05mm."),
        ("ast-hpump-04", "manual", "Bosch Rexroth A4VSO-355 — Section 7.3 Sealing System",
         "Internal leakage >2%/hr indicates seal degradation. Replace seal kit P/N 2207-K."),
        ("ast-bfurn-02", "manual", "Paul Wurth BF-4500 — Tuyere Monitoring",
         "Tuyere shell temperature normal range 950–1100°C. Sustained >+40°C = cooling-stave wear."),
        ("ast-gbox-09", "manual", "Flender B4SH-13 — Oil analysis tribology",
         "Quarterly oil sample. Iron PPM > 80 indicates accelerated wear."),
        ("ast-turb-01", "sop", "SOP CPP-EM-01 — Turbine Emergency Shutdown",
         "Trip threshold at vibration > 9 mm/s sustained 30s. Sequence: governor → main steam → exhaust."),
        ("ast-bfc-01", "manual", "KSB Etanorm — Hydraulic Performance Tuning",
         "Flow rate within ±5% of nominal. Investigate impeller wear if dropping."),
        ("ast-sint-01", "sop", "SOP SS-440-WHL — Pallet Wheel Replacement",
         "Use lifting jig PJ-12. Torque pallet bolts 410 Nm cross-pattern."),
        ("ast-cob-04", "manual", "Uhde COB-65 — Wall Refractory Maintenance",
         "Hot-spot inspection weekly. Patch repair if temperature > 1180°C sustained 2h."),
        ("ast-comp-01", "manual", "Atlas Copco ZH-15000 — Unloader Valve Service",
         "Short-cycling indicates unloader malfunction. Replace seat kit annually."),
    ]
    return [{"id": _id(), "asset_id": a, "type": t, "title": title, "content": content}
            for (a, t, title, content) in docs]

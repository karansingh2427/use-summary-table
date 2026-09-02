#!/usr/bin/env python3
"""
SIVANTO 400 SL Use Summary Table Extraction
Systematic extraction following extraction-rules.md and derivation-rules.md
"""

import csv
from typing import List, Dict

# Product-level constants from label pages 1-5
EPA_REG = "264-1198"
PHYSICAL_FORM = "SL"
PRODUCT_NAME = "SIVANTO® 400 SL"
AI_CONCENTRATION = 3.34  # lb ai/gallon
SOURCE_FILE = "264-1198_SIVANTO® 400 SL_9_5_2019_BASE.pdf"

# Product-wide restrictions (R-14: apply to ALL rows)
PRODUCT_WIDE_GEOGRAPHIC = ("No aerial application in New York State. "
                           "Not for sale, distribution or use in Nassau and Suffolk Counties "
                           "(except under FIFRA 24(c)/SLN).")

# Method-scoped restrictions (R-14: apply to matching methods only)
FOLIAR_DRIFT = "Max Release Height (ft): 10, ASABE Droplet Size: Coarse"
SOIL_DRIFT = "Not Applicable"

POLLINATOR_RESTRICTION = ("Pollinators: recommended that foliar insecticides are applied "
                          "late in the afternoon, evening, or at night outside of daily peak foraging periods.")

# REI from page 5
REI_DEFAULT = "4 hours"
REI_CA = "12 hours"
REI_NY_GRAPE = "12 hours"

# PPE from page 3
PPE_TEXT = ("Long sleeved shirt and long pants; "
            "Chemical resistant gloves made out of: barrier laminate, butyl rubber ≥ 14 mils, "
            "nitrile rubber ≥ 14 mils, neoprene rubber ≥ 14 mils, natural rubber ≥ 14 mils, "
            "polyethylene, polyvinyl chloride ≥ 14 mils, or viton ≥ 14 mils; Shoes and socks")

# Azole restriction (product-wide, all rows)
AZOLE_RESTRICTION = "DO NOT tank mix with azole fungicides (FRAC group 3) during bloom period"

# Schema from app/index.html
SCHEMA = [
    "Reg. #/File Sym",
    "Physical Form",
    "Product Name (PBN)",
    "Use",
    "Use Site",
    "App. Target",
    "App. Type",
    "App. Equipment",
    "App. Timing (Site Status)",
    "App. Timing (other)",
    "App Rate (lb ai/A)",
    "A.I. Max Single Rate/App. (lb a.i./A)",
    "Max # Apps/C.C.",
    "A.I. Max Total Rate/C.C. (lb a.i./A)",
    "Max # Apps/Yr.",
    "A.I. Max Total Rate/Yr. (lb a.i./A)",
    "MRI (days)",
    "REI",
    "PHI (days)",
    "PPE",
    "Additional Information",
    "Max No. of CC/yr",
    "Geographic Restrictions",
    "Drift Restrictions",
    "Soil Restrictions",
    "On-field Non-target Species Restrictions",
    "Additional Restrictions for Use/Use Site"
]

# Review columns
REVIEW_COLUMNS = ["Source File", "Page", "Confidence"]

def oz_to_lb_ai(oz_rate_min: float, oz_rate_max: float, ai_per_gal: float) -> str:
    """Convert fl oz/A product rate to lb ai/A."""
    lb_ai_min = (oz_rate_min / 128) * ai_per_gal
    lb_ai_max = (oz_rate_max / 128) * ai_per_gal
    return f"{lb_ai_min:.3f} - {lb_ai_max:.3f} FLU"

def derive_use_site(evidence: Dict) -> str:
    """D1: Derive Use Site from label evidence."""
    if "planthouse" in evidence.get("section_heading", "").lower():
        return "Planthouse"
    if evidence.get("per_acre_rate") or evidence.get("aerial_or_ground_equipment"):
        return "Agricultural (Outdoor)"
    return "NS"

def derive_app_type(target: str, methods: List[str]) -> str:
    """D2: Derive App. Type from target and delivery methods."""
    types = []
    if target == "Foliar":
        if "broadcast" in " ".join(methods).lower():
            types.append("Broadcast")
    elif target == "Soil":
        if "chemigation" in " ".join(methods).lower():
            types.append("Chemigation")
        if "injection" in " ".join(methods).lower() or "inject" in " ".join(methods).lower():
            types.append("Injection")
        if "in-furrow" in " ".join(methods).lower():
            types.append("In-furrow spray")
        if "drench" in " ".join(methods).lower():
            types.append("Drench")
    return ", ".join(types) if types else "NS"

def derive_timing_status(target: str, evidence: Dict) -> str:
    """D3: Derive App. Timing (Site Status) from label evidence."""
    text = evidence.get("text", "").lower()
    
    # D3.1-D3.6: Explicit timing phrases
    if "pre-emergence" in text and "post-emergence" in text:
        return "Pre-emergence/ Post-emergence"
    if "pre-emergence" in text:
        return "Pre-emergence"
    if "post-emergence" in text:
        return "Post-emergence"
    if "at-planting" in text or "at planting" in text:
        if "transplant" in text:
            return "At-planting / Post-transplant"
        return "At-planting"
    if "transplant" in text:
        return "Post-transplant"
    
    # D3.9: Soil placement implying standing plant
    if target == "Soil" and any(x in text for x in ["basal drench", "drip line", "tree canopy", "trunk"]):
        return "Post-emergence"
    
    # D3.7: Foliar default
    if target == "Foliar":
        return "Post-emergence"
    
    return "NS"

def build_row(crop_data: Dict) -> Dict:
    """Build a complete UST row from extracted crop data."""
    row = {
        "Reg. #/File Sym": EPA_REG,
        "Physical Form": PHYSICAL_FORM,
        "Product Name (PBN)": PRODUCT_NAME,
        "Use": crop_data["crop_name"],
        "Use Site": derive_use_site(crop_data["evidence"]),
        "App. Target": crop_data["app_target"],
        "App. Type": derive_app_type(crop_data["app_target"], crop_data["methods"]),
        "App. Equipment": crop_data.get("equipment", "NS"),
        "App. Timing (Site Status)": derive_timing_status(crop_data["app_target"], crop_data["evidence"]),
        "App. Timing (other)": crop_data.get("timing_other", "When pests occur"),
        "App Rate (lb ai/A)": crop_data.get("app_rate", "NS"),
        "A.I. Max Single Rate/App. (lb a.i./A)": crop_data.get("max_single_rate", "NS"),
        "Max # Apps/C.C.": crop_data.get("max_apps_cc", "NS"),
        "A.I. Max Total Rate/C.C. (lb a.i./A)": crop_data.get("max_total_cc", "NS"),
        "Max # Apps/Yr.": crop_data.get("max_apps_yr", "NS"),
        "A.I. Max Total Rate/Yr. (lb a.i./A)": crop_data.get("max_total_yr", "NS"),
        "MRI (days)": crop_data.get("mri", "NS"),
        "REI": REI_DEFAULT,  # Can be overridden for CA or NY grapes
        "PHI (days)": crop_data.get("phi", "NS"),
        "PPE": PPE_TEXT,
        "Additional Information": crop_data.get("additional_info", "NS"),
        "Max No. of CC/yr": crop_data.get("max_cc_yr", "NS"),
        "Geographic Restrictions": crop_data.get("geographic", PRODUCT_WIDE_GEOGRAPHIC),
        "Drift Restrictions": FOLIAR_DRIFT if crop_data["app_target"] == "Foliar" else SOIL_DRIFT,
        "Soil Restrictions": crop_data.get("soil_restrictions", "Not Applicable"),
        "On-field Non-target Species Restrictions": POLLINATOR_RESTRICTION if crop_data["app_target"] == "Foliar" else "Not Applicable",
        "Additional Restrictions for Use/Use Site": crop_data.get("additional_restrictions", AZOLE_RESTRICTION),
        "Source File": SOURCE_FILE,
        "Page": crop_data.get("page", "NS"),
        "Confidence": crop_data.get("confidence", "High")
    }
    return row

def write_csv(rows: List[Dict], output_path: str):
    """Write rows to CSV with schema order."""
    all_columns = SCHEMA + REVIEW_COLUMNS
    with open(output_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=all_columns)
        writer.writeheader()
        writer.writerows(rows)
    print(f"Wrote {len(rows)} rows to {output_path}")

if __name__ == "__main__":
    print("SIVANTO 400 SL Extraction Framework")
    print("=" * 80)
    print("This script provides the extraction framework.")
    print("Manual extraction of 44 rows from label is required.")
    print("=" * 80)

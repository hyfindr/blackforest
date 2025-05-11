import os
import json
import re
import requests
import pandas as pd
import pymysql
import mysql.connector
from dotenv import load_dotenv

# === Load environment variables ===
load_dotenv()

# === Config ===
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "google/gemini-1.5-flash")

DB_CONFIG = {
    "host": os.getenv("DB_HOST", "46.4.73.18"),
    "user": os.getenv("DB_USER", "root"),
    "password": os.getenv("DB_PASSWORD", "TX1wQ391RQ&P"),
    "database": os.getenv("DB_NAME", "blackforest"),
    "port": int(os.getenv("DB_PORT", 3306))
}

# === DB Connection ===
def get_db_connection():
    return mysql.connector.connect(**DB_CONFIG)

def get_extracted_text_from_db(pdf_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT ai_extracted_data FROM parsed_pdfs WHERE id = %s", (pdf_id,))
    row = cursor.fetchone()
    conn.close()
    return row[0] if row else None

def get_all_material_names():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT grade_name FROM materials")
    rows = cursor.fetchall()
    conn.close()
    return [row[0] for row in rows if row[0]]

def get_material_id_by_grade(grade_name):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM materials WHERE grade_name = %s", (grade_name,))
    row = cursor.fetchone()
    conn.close()
    return row[0] if row else None

# === LLM Call ===
def call_openrouter_agent(prompt, system_message):
    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json"
    }
    body = {
        "model": OPENROUTER_MODEL,
        "messages": [
            {"role": "system", "content": system_message},
            {"role": "user", "content": prompt}
        ]
    }
    response = requests.post(url, json=body, headers=headers)
    response.raise_for_status()
    return response.json()["choices"][0]["message"]["content"].strip()

# === Grade Matching ===
def find_material_with_agent(pdf_id):
    text = get_extracted_text_from_db(pdf_id)
    if not text:
        print("❌ No extracted text.")
        return None, None

    material_list = get_all_material_names()
    if not material_list:
        print("❌ No material names found.")
        return None, None

    prompt = f"""
You are a material grade recognition assistant.

Given the document text below and a list of valid material grade names, return the **most likely full material grade name** mentioned in the text. The name **must match exactly** one from the list.

Text:
---
{text}
---

Valid grade names:
{chr(10).join(f"- {name}" for name in material_list)}

Return the best matching grade name as a CSV string, like: \"S355J2\"
"""
    try:
        response = call_openrouter_agent(prompt, "You are an expert in identifying material grades in test report documents.")
        print("🤖 Material Match Response:", response)
        matched_name = response.strip().strip('"')
        grade_id = get_material_id_by_grade(matched_name)
        return matched_name, grade_id
    except Exception as e:
        print("❌ LLM material match failed:", e)
        return None, None

# === Property Names ===
def get_chemical_property_names(grade_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT DISTINCT element FROM chemical_properties WHERE grade_id = %s", (grade_id,))
    elements = [row[0] for row in cursor.fetchall()]
    conn.close()
    return elements

def get_mechanical_property_names(grade_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT DISTINCT property_name FROM mechanical_properties WHERE grade_id = %s", (grade_id,))
    props = [row[0] for row in cursor.fetchall()]
    conn.close()
    return props

# === Extractors ===
def extract_chemical_properties(text, material_name, property_names):
    prop_str = ", ".join(property_names)
    prompt = f"""
You are a chemical properties extraction assistant.

A test report has been parsed for material grade: **{material_name}**

Text:
---
{text}
---

Please extract only the following chemical properties:
{prop_str}

Return a JSON list of objects, each with:
- \"property_name\"
- \"value\"
"""
    return call_openrouter_agent(prompt, "You are an expert in extracting chemical composition values from material test reports. Respond in JSON format.")

def extract_mechanical_properties(text, material_name, property_names):
    prop_str = ", ".join(property_names)
    prompt = f"""
You are a mechanical properties extraction assistant.

A test report has been parsed for material grade: **{material_name}**

Text:
---
{text}
---

Please extract only the following mechanical properties:
{prop_str}

Return a JSON list of objects, each with:
- \"property_name\"
- \"value\"
"""
    return call_openrouter_agent(prompt, "You are an expert in extracting mechanical test values from engineering reports. Respond in JSON format.")

# === JSON Cleaning ===
def clean_json_text(text):
    return re.sub(r"^```(?:json)?|```$", "", text.strip(), flags=re.MULTILINE)

# === Value Helpers ===
def extract_value_range(value):
    if isinstance(value, dict):
        def to_float(val):
            try:
                return float(val.replace(",", ".")) if val and val != "-" else None
            except:
                return None
        return to_float(value.get("min")), to_float(value.get("max"))

    if isinstance(value, (int, float)):
        return float(value), float(value)

    if isinstance(value, str):
        value = value.replace(",", ".")
        numbers = re.findall(r"[-+]?\d*\.\d+|\d+", value)
        if len(numbers) >= 2:
            return float(numbers[0]), float(numbers[1])
        elif len(numbers) == 1:
            return float(numbers[0]), float(numbers[0])

    return None, None

# === Comparators ===
def compare_chemical_properties(sample_data, grade_id):
    conn = pymysql.connect(**DB_CONFIG)
    df = pd.read_sql("SELECT element, min_value, max_value FROM chemical_properties WHERE grade_id = %s", conn, params=[grade_id])
    conn.close()
    df['min_value'] = pd.to_numeric(df['min_value'], errors='coerce')
    df['max_value'] = pd.to_numeric(df['max_value'], errors='coerce')

    results = []
    all_within_range = True

    for item in sample_data:
        name = item["property_name"]
        val_min, val_max = extract_value_range(item["value"])
        value = val_min if val_min is not None else val_max

        if value is None:
            result = "INVALID VALUE"
            min_val = max_val = None
            all_within_range = False
        else:
            row = df[df["element"] == name]
            if row.empty:
                result = "ELEMENT NOT FOUND IN STANDARD"
                min_val = max_val = None
                all_within_range = False
            else:
                min_val = row.iloc[0]["min_value"]
                max_val = row.iloc[0]["max_value"]

                if pd.notna(min_val) and pd.notna(max_val):
                    result = "WITHIN RANGE" if min_val <= value <= max_val else "NOT WITHIN RANGE"
                    if not (min_val <= value <= max_val):
                        all_within_range = False
                elif pd.isna(min_val) and pd.notna(max_val):
                    result = "WITHIN RANGE" if value <= max_val else "NOT WITHIN RANGE"
                    if value > max_val:
                        all_within_range = False
                elif pd.notna(min_val) and pd.isna(max_val):
                    result = "WITHIN RANGE" if value >= min_val else "NOT WITHIN RANGE"
                    if value < min_val:
                        all_within_range = False
                else:
                    result = "UNKNOWN CASE"
                    all_within_range = False

        results.append({
            "element": name,
            "sample_value": value,
            "min_value": min_val,
            "max_value": max_val,
            "result": result
        })

    return pd.DataFrame(results), all_within_range

def compare_mechanical_properties(sample_data, grade_id):
    conn = pymysql.connect(**DB_CONFIG)
    df = pd.read_sql("""
        SELECT property_name, min_value, max_value
        FROM mechanical_properties
        WHERE grade_id = %s
    """, conn, params=[grade_id])
    conn.close()

    df['min_value'] = pd.to_numeric(df['min_value'], errors='coerce')
    df['max_value'] = pd.to_numeric(df['max_value'], errors='coerce')

    results = []
    all_within_range = True

    for item in sample_data:
        prop = item["property_name"]
        val_min, val_max = extract_value_range(item["value"])
        row = df[df["property_name"] == prop]

        if row.empty:
            result = "NOT WITHIN RANGE"
            std_min = std_max = None
            all_within_range = False
        else:
            std_min = row.iloc[0]["min_value"]
            std_max = row.iloc[0]["max_value"]

            if pd.notna(std_min) and pd.notna(std_max):
                if std_min <= val_min and val_max <= std_max:
                    result = "WITHIN RANGE"
                elif val_max < std_min or val_min > std_max:
                    result = "NOT WITHIN RANGE"
                    all_within_range = False
                else:
                    result = "PARTIALLY WITHIN RANGE"
                    all_within_range = False
            elif pd.isna(std_min) and pd.notna(std_max):
                result = "WITHIN RANGE" if val_max <= std_max else "NOT WITHIN RANGE"
                if val_max > std_max:
                    all_within_range = False
            elif pd.notna(std_min) and pd.isna(std_max):
                result = "WITHIN RANGE" if val_min >= std_min else "NOT WITHIN RANGE"
                if val_min < std_min:
                    all_within_range = False
            else:
                result = "UNKNOWN CASE"
                all_within_range = False

        results.append({
            "property": prop,
            "sample_min": val_min,
            "sample_max": val_max,
            "standard_min": std_min,
            "standard_max": std_max,
            "result": result
        })

    return pd.DataFrame(results), all_within_range

# === Master Runner ===
def extract_and_compare(pdf_id):
    material_name, grade_id = find_material_with_agent(pdf_id)
    if not material_name or not grade_id:
        print("❌ Material not matched.")
        return None

    text = get_extracted_text_from_db(pdf_id)
    if not text:
        print("❌ Text not found.")
        return None

    chem_names = get_chemical_property_names(grade_id)
    mech_names = get_mechanical_property_names(grade_id)

    chem_json = extract_chemical_properties(text, material_name, chem_names)
    mech_json = extract_mechanical_properties(text, material_name, mech_names)

    print("📦 RAW CHEMICAL JSON:\n", chem_json)
    print("📦 RAW MECHANICAL JSON:\n", mech_json)

    try:
        chem_data = json.loads(clean_json_text(chem_json))
        mech_data = json.loads(clean_json_text(mech_json))
    except json.JSONDecodeError as e:
        print("❌ Failed to parse JSON:", e)
        return None

    chem_results, chem_ok = compare_chemical_properties(chem_data, grade_id)
    mech_results, mech_ok = compare_mechanical_properties(mech_data, grade_id)

    all_ok = chem_ok and mech_ok
    return chem_results, mech_results, all_ok

# === CLI ===
if __name__ == "__main__":
    test_pdf_id = 24
    result = extract_and_compare(test_pdf_id)

    if result is None:
        print("❌ Extraction and comparison failed.")
    else:
        chem_df, mech_df, all_passed = result
        print("\n🔬 Chemical Comparison:\n", chem_df)
        print("\n🛠 Mechanical Comparison:\n", mech_df)
        print("\n✅ Overall Result:", "PASS" if all_passed else "FAIL")
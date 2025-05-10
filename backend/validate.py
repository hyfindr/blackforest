import re
import fitz  # PyMuPDF
import mysql.connector
from dotenv import load_dotenv
import os
import requests

load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "google/gemini-1.5-flash")  # Ensure correct model name

# Connect to MySQL
def get_db_connection():
    return mysql.connector.connect(
        host=os.getenv("DB_HOST"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME"),
        port=int(os.getenv("DB_PORT", 3306))
    )

# Get extracted text from parsed PDF record
def get_extracted_text_from_db(pdf_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT raw_extractions FROM HybridOCR_AIParsed WHERE id = %s", (pdf_id,))
    row = cursor.fetchone()
    conn.close()
    return row[0] if row else None

# Find material name from HybridOCR_AIParsed content
def find_material(pdf_id):
    text = get_extracted_text_from_db(pdf_id).lower()
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, grade_name FROM materials")
    materials = cursor.fetchall()
    conn.close()
    for material_id, grade_name in materials:
        if grade_name and grade_name.lower() in text:
            return grade_name, material_id
    return None, None

# Fetch chemical properties for a material
def find_chemical_properties(grade_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT element, min_value, max_value
        FROM chemical_properties
        WHERE grade_id = %s
    """, (grade_id,))
    results = cursor.fetchall()
    conn.close()
    return results

# Fetch mechanical properties for a material
def find_mechanical_properties(grade_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT diameter, property_name, unit, min_value, max_value
        FROM mechanical_properties
        WHERE grade_id = %s
    """, (grade_id,))
    results = cursor.fetchall()
    conn.close()
    return results

# Extract specific values from text
def extract_values_from_text(text, chemical_elements, mechanical_props):
    values = {}
    for element in chemical_elements:
        pattern = fr"{element}\s*[:=]?\s*(\d+(\.\d+)?)(\s*%?)"
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            values[element] = match.group(1)

    for prop in mechanical_props:
        pattern = fr"{prop}\s*[:=]?\s*(\d+(\.\d+)?)(\s*\w+)?"
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            values[prop] = match.group(1)
    return values

# Call OpenRouter/Gemini
def call_openrouter(prompt):
    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json"
    }
    body = {
        "model": OPENROUTER_MODEL,
        "messages": [
            {"role": "system", "content": "You are a material inspector AI. Respond with only 'true' or 'false'."},
            {"role": "user", "content": prompt}
        ]
    }
    response = requests.post(url, json=body, headers=headers)

    print("STATUS:", response.status_code)
    print("RESPONSE TEXT:", response.text)

    if not response.ok:
        response.raise_for_status()

    content = response.json()["choices"][0]["message"]["content"]
    print("🔍 Gemini response:", content)
    return content.strip().lower() in ["true", "yes", "1"]

# Generate human-readable property descriptions
def format_chemical_ranges(chemical_ranges):
    return "\n".join(
        f"The {item['element']} value should be between {item['min_value']} and {item['max_value']} to be valid."
        for item in chemical_ranges
    )

def format_mechanical_ranges(mechanical_ranges):
    return "\n".join(
        f"The {item['property_name']} ({item['unit']}) for diameter {item['diameter']} should be between {item['min_value']} and {item['max_value']}."
        for item in mechanical_ranges
    )

# Validate chemical and mechanical properties
def validate_with_gemini(pdf_id):
    material_name, grade_id = find_material(pdf_id)
    if not grade_id:
        print(f"❌ No matching material found for PDF ID {pdf_id}")
        return False

    chemical_ranges = find_chemical_properties(grade_id)
    mechanical_ranges = find_mechanical_properties(grade_id)
    extracted_text = get_extracted_text_from_db(pdf_id)

    chem_text = format_chemical_ranges(chemical_ranges)
    mech_text = format_mechanical_ranges(mechanical_ranges)

    # Extracted values preview
    chemical_elements = [item['element'] for item in chemical_ranges]
    mechanical_props = list(set(item['property_name'] for item in mechanical_ranges))

    extracted_values = extract_values_from_text(extracted_text, chemical_elements, mechanical_props)

    print(f"\n📄 Material: {material_name}")
    print(f"\n🧾 Extracted Values from Text:")
    for k, v in extracted_values.items():
        print(f" - {k}: {v}")

    print(f"\n🧪 Chemical Property Rules:\n{chem_text}")
    print(f"\n🔧 Mechanical Property Rules:\n{mech_text}")

    prompt = f"""
    Here is the extracted text from a material test report for material '{material_name}':

    {extracted_text[:4000]}

    Validate whether the chemical composition values meet the following conditions:
    {chem_text}

    And whether the mechanical properties meet these conditions:
    {mech_text}

    Respond only with 'true' or 'false'.
    """

    print(f"\n📬 Prompt sent to OpenRouter (truncated):\n{prompt[:1000]}...\n")

    return call_openrouter(prompt)

# Run validation
print(validate_with_gemini(15))

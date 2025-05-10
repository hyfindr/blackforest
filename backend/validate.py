import os
import requests
import mysql.connector
from dotenv import load_dotenv

# === Load environment variables ===
load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "google/gemini-1.5-flash")

# === DB Connection ===
def get_db_connection():
    return mysql.connector.connect(
        host=os.getenv("DB_HOST"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME"),
        port=int(os.getenv("DB_PORT", 3306))
    )

# === Fetch raw text for given PDF ID ===
def get_extracted_text_from_db(pdf_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT ai_extracted_data FROM parsed_pdfs WHERE id = %s", (pdf_id,))
    row = cursor.fetchone()
    conn.close()
    return row[0] if row else None

# === Find matching material by name ===
def find_material(pdf_id):
    text = get_extracted_text_from_db(pdf_id)
    print("📄 Extracted Text:", text[:1000], "...")  # Print first 100 characters for debugging
    if text is None:
        print(f"❌ No extracted text found for PDF ID {pdf_id}")
        return None, None

    text = text.lower()

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, grade_name FROM materials")
    materials = cursor.fetchall()
    conn.close()

    for material_id, grade_name in materials:
        if grade_name and grade_name.lower() in text:
            return grade_name, material_id

    return None, None

# === Get property names ===
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

# === Generic LLM call ===
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
    print("📡 OpenRouter Status:", response.status_code)

    if not response.ok:
        print("❌ Error:", response.text)
        response.raise_for_status()

    content = response.json()["choices"][0]["message"]["content"].strip()
    print("📥 Extracted JSON output:\n", content[:500], "...\n")
    return content

# === Agent for chemical properties ===
def extract_chemical_properties(pdf_id, extracted_text, material_name, property_names):
    prop_str = ", ".join(property_names)
    prompt = f"""
You are a chemical properties extraction assistant.

A test report has been parsed for material grade: **{material_name}**

Text:
---
{extracted_text[:4000]}
---

Please extract only the following chemical properties:
{prop_str}

Return a JSON list of objects, each with:
- "property_name"
- "value"
"""
    return call_openrouter_agent(prompt, "You are an expert in extracting chemical composition values from material test reports. Respond in JSON format.")

# === Agent for mechanical properties ===
def extract_mechanical_properties(pdf_id, extracted_text, material_name, property_names):
    prop_str = ", ".join(property_names)
    prompt = f"""
You are a mechanical properties extraction assistant.

A test report has been parsed for material grade: **{material_name}**

Text:
---
{extracted_text}
---

Please extract only the following mechanical properties:
{prop_str}

Return a JSON list of objects, each with:
- "property_name"
- "value"
"""
    return call_openrouter_agent(prompt, "You are an expert in extracting mechanical test values from engineering reports. Respond in JSON format.")

# === Combined wrapper ===
def extract_properties_separately(pdf_id):
    material_name, grade_id = find_material(pdf_id)
    if not material_name:
        print(f"❌ No material matched for PDF ID {pdf_id}")
        return None, None

    extracted_text = get_extracted_text_from_db(pdf_id)
    if not extracted_text:
        print(f"❌ No text found for PDF ID {pdf_id}")
        return None, None

    chemical_props = get_chemical_property_names(grade_id)
    mechanical_props = get_mechanical_property_names(grade_id)

    chem_json = extract_chemical_properties(pdf_id, extracted_text, material_name, chemical_props) if chemical_props else "[]"
    mech_json = extract_mechanical_properties(pdf_id, extracted_text, material_name, mechanical_props) if mechanical_props else "[]"

    return chem_json, mech_json

# === Run test ===
if __name__ == "__main__":
    test_pdf_id = 2
    chemical, mechanical = extract_properties_separately(test_pdf_id)
    print("\n✅ Extracted Chemical Properties:\n", chemical)
    print("\n✅ Extracted Mechanical Properties:\n", mechanical)

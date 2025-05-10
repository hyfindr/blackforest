import os
import json
import requests
import mysql.connector
from dotenv import load_dotenv

load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL")


def get_db_connection():
    return mysql.connector.connect(
        host=os.getenv("DB_HOST"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME"),
        port=int(os.getenv("DB_PORT", 3306))
    )


def get_extracted_text_from_db(pdf_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT ai_extracted_data FROM parsed_pdfs WHERE id = %s", (pdf_id,))
    row = cursor.fetchone()
    conn.close()
    return row[0] if row else ""


def get_all_material_names(category):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT grade_name FROM materials WHERE category_id = %s", (category, ))
    materials = cursor.fetchall()
    conn.close()
    return [m[0] for m in materials if m[0]]


def call_openrouter(prompt):
    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json"
    }
    body = {
        "model": OPENROUTER_MODEL,
        "messages": [
            {"role": "user", "content": prompt}

        ]
    }

    response = requests.post(url, headers=headers, json=body)
    response.raise_for_status()
    return response.json()["choices"][0]["message"]["content"]


def validate_with_llm(pdf_id, cetagory):
    extracted_text = get_extracted_text_from_db(pdf_id)
    if not extracted_text:
        print("No extracted text found.")
        return []

    material_list = get_all_material_names(cetagory)
    grade_names_str = "\n".join(f"- {m}" for m in material_list)

    prompt = f"""
    Identify material grade names (also known as material qualities) mentioned in the following technical document text.

    Some grade names may include prefixes or suffixes, or be followed by punctuation like a dot or comma. However, grade names should not contain additional characters inserted within the name itself and schould contain full grade name from the list.
    Do NOT match a valid grade name The found value is **only a partial or shortened prefix** of the grade name
    Document text:
    {extracted_text}

    Below is a list of valid grade names to match against:
    {grade_names_str}

    Return ONLY JSON array of value matched grade names from the list above. Include partial matches or prefixed names. Multiple matches may be returned.
    """
    print("Sending to OpenRouter...")
    try:
        response = call_openrouter(prompt)
        print("LLM Response:", response)

        matches = json.loads(response)
        return matches if isinstance(matches, list) else []
    except Exception as e:
        print(f"Error during LLM match: {e}")
        return []


if __name__ == "__main__":
    for i in range(1, 11):
        matched_materials = validate_with_llm(i, 1)

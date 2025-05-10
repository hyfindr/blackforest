import os
import fitz  # PyMuPDF
import pytesseract
import requests
import mysql.connector
import logging
from PIL import Image
from pdf2image import convert_from_path
from dotenv import load_dotenv  # Load environment variables

# Load environment variables
load_dotenv()

# Setup logging
logging.basicConfig(level=logging.INFO)

# Tesseract config
pytesseract.pytesseract.tesseract_cmd = os.getenv("TESSERACT_CMD")
os.environ['TESSDATA_PREFIX'] = os.getenv("TESSDATA_PREFIX")

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "gemini-1.5-flash")


# Ensure lang files exist
def download_tesseract_lang_data(lang):
    tessdata_dir = os.environ['TESSDATA_PREFIX']
    os.makedirs(tessdata_dir, exist_ok=True)
    lang_file = os.path.join(tessdata_dir, f"{lang}.traineddata")
    if not os.path.exists(lang_file):
        print(f"⬇️ Downloading language data: {lang}")
        url = f"https://github.com/tesseract-ocr/tessdata_best/raw/main/{lang}.traineddata"
        r = requests.get(url)
        with open(lang_file, "wb") as f:
            f.write(r.content)


# Database connection
def get_db_connection():
    try:
        conn = mysql.connector.connect(
            host=os.getenv("DB_HOST"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD"),
            database=os.getenv("DB_NAME"),
            port=int(os.getenv("DB_PORT", 3306))
        )
        logging.info("✅ DB connection established.")
        return conn
    except mysql.connector.Error as err:
        logging.error(f"❌ DB connection failed: {err}")
        return None


# Call OpenRouter/Gemini
def call_openrouter_api(prompt):
    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json"
    }
    body = {
        "model": OPENROUTER_MODEL,
        "messages": [
            {"role": "system", "content": "You are an expert document parser. Extract key structured data from the provided document text."},
            {"role": "user", "content": prompt}
        ]
    }

    response = requests.post(url, json=body, headers=headers)
    if response.status_code != 200:
        print("❌ API Error:", response.status_code)
        print("📩 Response content:", response.text)
    response.raise_for_status()
    return response.json()["choices"][0]["message"]["content"]


# Save raw + AI data to DB
def save_texts_to_database(filename, category, raw_content, ai_extracted_content, pdf_binary):
    conn = get_db_connection()
    if not conn:
        return
    try:
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS HybridOCR_AIParsed (
                id INT AUTO_INCREMENT PRIMARY KEY,
                filename VARCHAR(255) NOT NULL,
                category VARCHAR(255),
                file_data LONGBLOB,
                raw_extractions LONGTEXT,
                ai_extracted_data LONGTEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        """)
        cursor.execute("""
            INSERT INTO HybridOCR_AIParsed (filename, category, file_data, raw_extractions, ai_extracted_data)
            VALUES (%s, %s, %s, %s, %s)
        """, (filename, category, pdf_binary, raw_content, ai_extracted_content))
        conn.commit()
        logging.info(f"💾 Saved to DB: {filename} in category: {category}")
    except mysql.connector.Error as err:
        logging.error(f"❌ DB insert failed: {err}")
    finally:
        conn.close()


# Main PDF processor
def process_pdf(input_pdf_path, lang='eng', category="Uncategorized"):
    for l in lang.split('+'):
        download_tesseract_lang_data(l)

    try:
        images = convert_from_path(input_pdf_path, dpi=300)
    except Exception as e:
        logging.error(f"❌ Error converting {input_pdf_path} to images: {e}")
        return

    all_text = []

    for page_num, image in enumerate(images):
        logging.info(f"🔄 Processing page {page_num + 1} of {input_pdf_path}")
        try:
            ocr_text = pytesseract.image_to_string(image, lang=lang).strip()
        except Exception as e:
            logging.warning(f"⚠️ OCR failed on page {page_num + 1}: {e}")
            ocr_text = ""

        try:
            direct_text = fitz.open(input_pdf_path).load_page(page_num).get_text("text")
        except Exception as e:
            logging.warning(f"⚠️ PDF text extraction failed: {e}")
            direct_text = ""

        page_text = (direct_text + "\n" + ocr_text).strip()
        all_text.append(f"===== Page {page_num + 1} =====\n{page_text}")

    full_raw_text = "\n\n".join(all_text).strip()

    if not full_raw_text:
        logging.warning(f"⚠️ No text extracted from {input_pdf_path}")
        return

    try:
        prompt = f"Extract important structured data from the following document:\n\n{full_raw_text[:4000]}"
        ai_response = call_openrouter_api(prompt)
    except Exception as e:
        logging.error(f"❌ OpenRouter API call failed for {input_pdf_path}: {e}")
        ai_response = ""

    try:
        with open(input_pdf_path, 'rb') as f:
            pdf_binary = f.read()
    except Exception as e:
        logging.error(f"❌ Failed to read binary PDF: {e}")
        pdf_binary = None

    save_texts_to_database(os.path.basename(input_pdf_path), category, full_raw_text, ai_response, pdf_binary)


# Process all PDFs in subdirectories
def process_all_pdfs_in_directory(input_dir, lang='eng'):
    for root, _, files in os.walk(input_dir):
        if root == input_dir:
            continue  # Skip root folder PDFs

        category = os.path.basename(root)
        for file in files:
            if file.lower().endswith(".pdf"):
                full_path = os.path.join(root, file)
                print(f"✅ Found PDF in '{category}': {full_path}")
                process_pdf(full_path, lang=lang, category=category)


# Run
if __name__ == "__main__":
    input_directory = r"C:\Users\MatejIvic\Downloads\Liebherr-20250509T172616Z-001\Liebherr"
    languages = "eng+deu"

    print("📁 Starting hybrid PDF extraction with OCR + AI...\n")
    process_all_pdfs_in_directory(input_directory, lang=languages)
    print("\n✅ All PDFs processed and stored in DB.")

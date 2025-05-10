import os
import mysql.connector
import logging
from dotenv import load_dotenv
from llama_parse import LlamaParse
from llama_index.core import SimpleDirectoryReader

# Load environment variables
load_dotenv()

# Setup logging
logging.basicConfig(
    filename='flask.log',
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

# === ENV Variables ===
LLAMA_API_KEY = os.getenv("LLAMA_API_KEY")

# === LlamaParse Setup ===
parser = LlamaParse(api_key=LLAMA_API_KEY, result_type="text", verbose=True)

# === DB Connection ===
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

# === Save to DB ===
def save_texts_to_database(filename, category, ai_extracted_content, pdf_binary):
    conn = get_db_connection()
    if not conn:
        return
    try:
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS parsed_pdfs (
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
            INSERT INTO parsed_pdfs (filename, category, file_data, raw_extractions, ai_extracted_data)
            VALUES (%s, %s, %s, %s, %s)
        """, (filename, category, pdf_binary, "", ai_extracted_content))
        conn.commit()
        logging.info(f"💾 Saved to DB: {filename} in category: {category}")
    except mysql.connector.Error as err:
        logging.error(f"❌ DB insert failed: {err}")
    finally:
        conn.close()

# === Process a single PDF ===
def process_pdf(input_pdf_path, category="Uncategorized"):
    try:
        print(f"📄 Parsing with LlamaParse: {input_pdf_path}")
        documents = parser.load_data(input_pdf_path)
        parsed_text = "\n".join([doc.text for doc in documents])
        logging.info(f"✅ Parsed {len(parsed_text)} characters from PDF.")
    except Exception as e:
        logging.error(f"❌ LlamaParse failed for {input_pdf_path}: {e}")
        parsed_text = ""

    try:
        with open(input_pdf_path, 'rb') as f:
            pdf_binary = f.read()
    except Exception as e:
        logging.error(f"❌ Failed to read PDF binary: {e}")
        pdf_binary = None

    save_texts_to_database(
        filename=os.path.basename(input_pdf_path),
        category=category,
        ai_extracted_content=parsed_text,
        pdf_binary=pdf_binary
    )

# === Process directory ===
def process_all_pdfs_in_directory(input_dir):
    for root, _, files in os.walk(input_dir):
        if root == input_dir:
            continue  # Skip root folder

        category = os.path.basename(root)
        for file in files:
            if file.lower().endswith(".pdf"):
                full_path = os.path.join(root, file)
                print(f"✅ Found PDF in '{category}': {full_path}")
                process_pdf(full_path, category=category)

# === Run ===
if __name__ == "__main__":
    input_directory = r"C:\Users\MatejIvic\Downloads\Liebherr-20250509T172616Z-001\Liebherr\Casting Undercarriage"
    print("📁 Starting LlamaParse PDF extraction with llama-parse SDK...\n")
    process_all_pdfs_in_directory(input_directory)
    print("\n✅ All PDFs parsed and saved to DB.")

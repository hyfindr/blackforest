from flask import Flask, request, jsonify
import mysql.connector
import os
from werkzeug.utils import secure_filename
from dotenv import load_dotenv
from pdf_parser import process_pdf
import tempfile

load_dotenv()

app = Flask(__name__)

# Database connection


def get_db_connection():
    return mysql.connector.connect(
        host=os.getenv("DB_HOST"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME"),
        port=int(os.getenv("DB_PORT", 3306))
    )


UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


def persist_certificate(filename, category):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        query = """
            INSERT INTO parsed_pdfs (filename, category)
            VALUES (%s, %s)
        """
        cursor.execute(query, (filename, category))
        conn.commit()
        cursor.close()
        conn.close()
    except mysql.connector.Error as err:
        raise Exception(f"Database error: {err}")


@app.route("/upload", methods=["POST"])
def upload_pdfs():
    if 'file[]' not in request.files:
        return jsonify({"error": "No files found in 'file[]'"}), 400

    files = request.files.getlist('file[]')
    category = request.form.get("category", "Uploaded")

    if not files:
        return jsonify({"error": "No files uploaded"}), 400

    successful_count = 0
    errors = []

    for file in files:
        if file.filename == '':
            errors.append({"filename": None, "error": "Empty filename"})
            continue

        if not file.filename.lower().endswith(".pdf"):
            errors.append({"filename": file.filename, "error": "Only PDF files are allowed"})
            continue

        try:
            with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_pdf:
                temp_pdf.write(file.read())
                temp_pdf_path = temp_pdf.name
                original_filename = secure_filename(file.filename)
                save_path = os.path.join(UPLOAD_DIR, original_filename)
                file.save(save_path)

            # Instead of processing the PDF here, we will publish it to a message queue
            # For example, using RabbitMQ or any other message broker
            # publish_to_queue(temp_pdf_path)  # Placeholder for actual message queue publishing
            persist_certificate(original_filename, category)    
            successful_count += 1

        except Exception as e:
            errors.append({"filename": file.filename, "error": f"Processing failed: {str(e)}"})

    response = {
        "message": f"{successful_count} Certificate{'s' if successful_count != 1 else ''} submitted for validation"
    }

    if errors:
        response["errors"] = errors

    return jsonify(response), 200


@app.route('/validations', methods=['GET'])
def get_validations():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT
                v.id AS id,
                c.name AS category_name,
                v.status AS status,
                v.created_at AS date
            FROM validations v
            JOIN parsed_pdfs p ON v.certificate_id = p.id
            JOIN categories c ON p.category = c.name;
        """)
        validations = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify(validations), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/validate", methods=["POST"])
def validate_pdf():
    # Placeholder: Will implement validation logic later
    return jsonify({"message": "Validate endpoint hit, logic to be implemented."}), 200


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)

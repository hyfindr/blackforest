from flask import Flask, request, jsonify
import mysql.connector
import os
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

            # Optional: process_pdf(temp_pdf_path, lang="eng+deu", category=category)
            successful_count += 1

        except Exception as e:
            errors.append({"filename": file.filename, "error": f"Processing failed: {str(e)}"})

    response = {
        "message": f"{successful_count} Certificate{'s' if successful_count != 1 else ''} submitted for validation"
    }

    if errors:
        response["errors"] = errors

    return jsonify(response), 200


@app.route("/validate", methods=["POST"])
def validate_pdf():
    # Placeholder: Will implement validation logic later
    return jsonify({"message": "Validate endpoint hit, logic to be implemented."}), 200


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)

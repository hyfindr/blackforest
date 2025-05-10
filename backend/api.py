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
def upload_pdf():
    if 'file' not in request.files:
        return jsonify({"error": "No file part in the request"}), 400

    file = request.files['file']
    # Optional form field, defaults to 'Uploaded'
    category = request.form.get("category", "Uploaded")

    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    if not file.filename.lower().endswith(".pdf"):
        return jsonify({"error": "Only PDF files are allowed"}), 400

    try:
        # Save uploaded file to a temp location
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_pdf:
            temp_pdf.write(file.read())
            temp_pdf_path = temp_pdf.name

        # Process the PDF with explicit category
        process_pdf(temp_pdf_path, lang="eng+deu", category=category)

        return jsonify({"message": f"'{file.filename}' uploaded and processed successfully under category '{category}'"}), 200

    except Exception as e:
        return jsonify({"error": f"Processing failed: {str(e)}"}), 500


@app.route("/validate", methods=["POST"])
def validate_pdf():
    # Placeholder: Will implement validation logic later
    return jsonify({"message": "Validate endpoint hit, logic to be implemented."}), 200


if __name__ == "__main__":
    app.run(debug=True)

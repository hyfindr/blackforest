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
            errors.append({"filename": file.filename,
                          "error": "Only PDF files are allowed"})
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
            errors.append({"filename": file.filename,
                          "error": f"Processing failed: {str(e)}"})

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


@app.route("/category/<string:category_id>", methods=["GET"])
def get_category_norm(category_id):
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Due to technical reasons, the server can't be reached."}), 500
    cursor = conn.cursor(dictionary=True)

    try:
        # 1. Get category and materials
        cursor.execute("""
            SELECT c.name AS category_name, m.id AS grade_id, m.grade_name
            FROM categories c
            JOIN materials m ON c.id = m.category_id
            WHERE c.id = %s
        """, (category_id,))
        materials = cursor.fetchall()

        if not materials:
            return jsonify({"error": "No materials found for this category."}), 404

        grade_ids = [m["grade_id"] for m in materials]

        # 2. Get chemical properties
        format_strings = ','.join(['%s'] * len(grade_ids))
        cursor.execute(f"""
            SELECT id, grade_id, element, min_value, max_value
            FROM chemical_properties
            WHERE grade_id IN ({format_strings})
        """, grade_ids)
        chem_props = cursor.fetchall()

        # 3. Organize chemical properties
        chem_map = {}
        for row in chem_props:
            chem_map.setdefault(row["grade_id"], []).append({
                "cprop_id": row["id"],
                "element": row["element"],
                "min_value": row["min_value"],
                "max_value": row["max_value"]
            })

        # 4. Get mechanical properties
        cursor.execute(f"""
            SELECT id, grade_id, diameter, property_name, unit, min_value, max_value
            FROM mechanical_properties
            WHERE grade_id IN ({format_strings})
        """, grade_ids)
        mech_props = cursor.fetchall()

        # 5. Organize mechanical properties (include diameter if not null)
        mech_map = {}
        for row in mech_props:
            prop = {
                "mprop_id": row["id"],
                "property_name": row["property_name"],
                "unit": row["unit"],
                "min_value": row["min_value"],
                "max_value": row["max_value"]
            }
            if row["diameter"] is not None:
                prop["diameter"] = row["diameter"]

            mech_map.setdefault(row["grade_id"], []).append(prop)

        # 6. Build response
        result = []
        for m in materials:
            result.append({
                "grade_id": m["grade_id"],
                "grade_name": m["grade_name"],
                "chemical_properties": chem_map.get(m["grade_id"], []),
                "mechanical_properties": mech_map.get(m["grade_id"], [])
            })

        return jsonify({
            "message": "Successfully retrieved category norms.",
            "category": materials[0]["category_name"],
            "materials": result
        }), 200

    except Exception as e:
        return jsonify({"error": f"Failed to retrieve category norms: {str(e)}"}), 500

    finally:
        cursor.close()
        conn.close()


@app.route("/prop_update", methods=["PUT"])
def update_property():
    data = request.form

    if not data or ('cprop_id' not in data and 'mprop_id' not in data):
        return jsonify({"error": "Missing required field: cprop_id or mprop_id"}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Due to technical reasons, the server can't be reached."}), 500
    cursor = conn.cursor(dictionary=True)

    try:
        # Determine which property table to update
        if 'cprop_id' in data:
            query = """
                UPDATE chemical_properties
                SET element = %s, min_value = %s, max_value = %s
                WHERE id = %s
            """
            cursor.execute(query, (
                data.get("element"),
                data.get("min_value"),
                data.get("max_value"),
                data["cprop_id"]
            ))

        elif 'mprop_id' in data:
            query = """
                UPDATE mechanical_properties
                SET property_name = %s, unit = %s, min_value = %s, max_value = %s, diameter = %s
                WHERE id = %s
            """
            cursor.execute(query, (
                data.get("property_name"),
                data.get("unit"),
                data.get("min_value"),
                data.get("max_value"),
                data.get("diameter"),  # can be None
                data["mprop_id"]
            ))

        conn.commit()

        if cursor.rowcount == 0:
            return jsonify({"error": "Property not found or no changes made."}), 404

        return jsonify({"message": "Property updated successfully."}), 200

    except Exception as e:
        return jsonify({"error": f"Update failed: {str(e)}"}), 500

    finally:
        cursor.close()
        conn.close()


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)

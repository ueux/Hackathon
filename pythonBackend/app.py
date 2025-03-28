from flask import Flask, request, jsonify, send_file
import os
import uuid
from werkzeug.utils import secure_filename
from modules.document_parser import DocumentParser
from modules.pptx_generator import PPTXGenerator

app = Flask(__name__)

# Configuration
UPLOAD_FOLDER = 'uploads'
OUTPUT_FOLDER = 'outputs'
ALLOWED_EXTENSIONS = {'pdf', 'docx', 'txt'}

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['OUTPUT_FOLDER'] = OUTPUT_FOLDER

# Ensure folders exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/api/upload', methods=['POST'])
def upload_file():
    if 'document' not in request.files:
        return jsonify({'error': 'No file part'}), 400

    file = request.files['document']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    if file and allowed_file(file.filename):
        # Generate unique file ID
        file_id = str(uuid.uuid4())
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], f"{file_id}_{filename}")
        file.save(filepath)

        return jsonify({
            'message': 'File uploaded successfully',
            'fileId': file_id,
            'filename': filename
        })

    return jsonify({'error': 'Invalid file type'}), 400

@app.route('/api/convert/<file_id>', methods=['POST'])
def convert_file(file_id):
    try:
        # Find the uploaded file
        uploads = os.listdir(app.config['UPLOAD_FOLDER'])
        file_info = next((f for f in uploads if f.startswith(file_id)), None)

        if not file_info:
            return jsonify({'error': 'File not found'}), 404

        input_path = os.path.join(app.config['UPLOAD_FOLDER'], file_info)
        output_filename = f"converted_{file_id}.pptx"
        output_path = os.path.join(app.config['OUTPUT_FOLDER'], output_filename)

        # Convert the document
        parser = DocumentParser(input_path)
        content = parser.extract_content()

        generator = PPTXGenerator(output_path)
        generator.generate_presentation(content)

        return jsonify({
            'message': 'Conversion successful',
            'pptxUrl': f'/api/download/{output_filename}',
            'filename': output_filename
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/download/<filename>')
def download_file(filename):
    file_path = os.path.join(app.config['OUTPUT_FOLDER'], filename)
    if os.path.exists(file_path):
        return send_file(file_path, as_attachment=True)
    return jsonify({'error': 'File not found'}), 404

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
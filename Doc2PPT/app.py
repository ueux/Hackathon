from flask import Flask, request, jsonify, send_from_directory
import os
import uuid
from werkzeug.utils import secure_filename
from modules.document_parser import DocumentParser
from modules.pptx_generator import PPTXGenerator
from flask_cors import CORS

app = Flask(__name__)

CORS(app, resources={
    r"/api/*": {
        "origins": "*",
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    }
})

UPLOAD_FOLDER = 'uploads'
OUTPUT_FOLDER = 'outputs'
ALLOWED_EXTENSIONS = {'pdf', 'docx', 'txt'}

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['OUTPUT_FOLDER'] = OUTPUT_FOLDER

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
        filename = secure_filename(file.filename)
        file_id = str(uuid.uuid4())
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], f"{file_id}_{filename}")
        file.save(filepath)

        return jsonify({
            'success': True,
            'fileId': file_id,
            'filename': filename
        })

    return jsonify({'error': 'Invalid file type'}), 400

@app.route('/api/convert/<file_id>', methods=['POST', 'OPTIONS'])
def convert_file(file_id):
    return jsonify({
            'success': True,
            'fileId': file_id,
        })
    if request.method == 'OPTIONS':
        # Handle preflight request
        response = jsonify({'success': True})
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        return response

    try:
        # Get JSON data more robustly
        data = request.get_json(force=True, silent=True) or {}

        uploads = os.listdir(app.config['UPLOAD_FOLDER'])
        file_info = next((f for f in uploads if f.startswith(file_id)), None)

        if not file_info:
            return jsonify({'error': 'File not found'}), 404

        input_path = os.path.join(app.config['UPLOAD_FOLDER'], file_info)
        output_filename = f"converted_{file_id}.pptx"
        output_path = os.path.join(app.config['OUTPUT_FOLDER'], output_filename)

        # Debug logging
        app.logger.info(f"Conversion started for {file_id}")
        app.logger.info(f"Request data: {data}")

        # Process customization options
        audience = data.get('audience', 'executive')
        length = data.get('length', 'medium')
        include_summary = data.get('summary', True)
        include_appendix = data.get('appendix', False)

        # Document processing
        parser = DocumentParser(input_path)
        content = parser.extract_content()

        generator = PPTXGenerator(output_path)
        generator.generate_presentation(content,
                                     audience=audience,
                                     length=length,
                                     include_summary=include_summary,
                                     include_appendix=include_appendix)

        response = jsonify({
            'success': True,
            'downloadUrl': f'/api/download/{output_filename}',
            'filename': output_filename
        })

        # Add CORS headers to the actual response
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response

    except Exception as e:
        app.logger.error(f"Conversion error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/download/<filename>')
def download_file(filename):
    try:
        return send_from_directory(
            app.config['OUTPUT_FOLDER'],
            filename,
            as_attachment=True
        )
    except FileNotFoundError:
        return jsonify({'error': 'File not found'}), 404

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
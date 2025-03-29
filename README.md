# Doc2PPT Converter - Full Stack Application

## Overview

This full-stack application combines a Node.js authentication system with a Python document processing backend to convert documents (PDF, DOCX, TXT) into PowerPoint presentations.

## Features

### Backend Services
1. **Node.js Authentication Service**
   - User registration and login
   - JWT authentication
   - Role-based access control
   - MongoDB data storage

2. **Python Document Processing Service**
   - Document parsing (PDF, DOCX, TXT)
   - Content analysis and structuring
   - PowerPoint generation
   - Custom template support

### Frontend
- Responsive UI with animated background
- Document upload and conversion interface
- User authentication flows
- Conversion progress tracking

## System Architecture

```
Client Browser
│
├── Node.js Auth Service (REST API)
│   ├── User authentication
│   ├── Session management
│   └── API gateway
│
└── Python Conversion Service
    ├── Document processing
    ├── PPT generation
    └── Analytical features
```

## Installation

### Prerequisites
- Node.js (v16+)
- Python (3.8+)
- MongoDB
- Redis (for session caching, optional)

### 1. Node.js Authentication Service

```bash
cd auth-service
npm install
cp .env.example .env
# Edit .env with your configuration
npm start
```

### 2. Python Conversion Service

```bash
cd conversion-service
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or venv\Scripts\activate  # Windows

pip install -r requirements.txt
cp config.ini.example config.ini
# Edit config.ini with your settings
python main.py
```

## Configuration

### Node.js Service (.env)
```
MONGODB_URI=mongodb://localhost:27017/doc2ppt
JWT_SECRET=your_jwt_secret_here
PORT=3000
PYTHON_SERVICE_URL=http://localhost:5000
```

### Python Service (config.ini)
```
[storage]
upload_folder=./uploads
output_folder=./outputs

[processing]
max_file_size=10485760  # 10MB
allowed_extensions=.pdf,.docx,.txt

[analytics]
numerical_analysis=true
```

## API Endpoints

### Authentication Service (Node.js)
- `POST /signin` - User registration
- `POST /login` - User login
- `POST /logout` - User logout
- `GET /profile` - User profile

### Conversion Service (Python)
- `POST /convert` - Document conversion
- `GET /status/<job_id>` - Conversion status
- `GET /download/<filename>` - Download PPT

## Workflow Integration

1. User authenticates via Node.js service
2. Frontend receives JWT token
3. User uploads document through authenticated API
4. Node.js service:
   - Validates authentication
   - Stores document temporarily
   - Queues conversion job
   - Returns job ID to client
5. Python service:
   - Processes document when job is picked up
   - Generates PowerPoint
   - Stores result in output folder
6. Client polls for status/downloads result

## Project Structure

```
doc2ppt/
├── backend/          # Node.js authentication
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middlewares/
│   ├── app.js
│   └── package.json
│
├── pythonBackend/    # Python document processing
│   ├── modules/
│   │   ├── document_parser.py
│   │   └── pptx_generator.py
│   ├── utils/
│   ├── main.py
│   └── requirements.txt
│
├── Application/                # Frontend assets
│   ├── css/
│   ├── js/
│   ├── images/
│   ├── signup.html
│   ├── login.html
│   └── converter.html
│
├── .env
├── config.ini
└── README.md
```

## Deployment Options

### Development
```bash
# Start Node.js service
cd auth-service && npm run dev

# Start Python service
cd conversion-service && python main.py
```

### Production with Docker
```docker
# Node.js service
docker build -t doc2ppt-auth -f auth-service/Dockerfile .

# Python service
docker build -t doc2ppt-converter -f conversion-service/Dockerfile .

# Run with docker-compose
docker-compose up -d
```

## Dependencies

### Node.js Service
- express
- mongoose
- bcryptjs
- jsonwebtoken
- cors
- axios

### Python Service
- flask
- python-docx
- pdfplumber
- python-pptx
- pandas (for data analysis)
- redis (for job queue)

## Security Considerations

1. Always use HTTPS in production
2. Keep JWT secrets secure
3. Validate all file uploads
4. Implement rate limiting
5. Use proper file permission on upload/output folders
6. Regularly update dependencies

## License

MIT License


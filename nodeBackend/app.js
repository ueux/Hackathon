const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// File upload setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const validTypes = ['.pdf', '.docx', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, validTypes.includes(ext));
  }
});

// API Routes
app.post('/api/convert', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded or invalid file type' });
    }

    const outputFilename = `converted-${Date.now()}.pptx`;
    const outputPath = path.join(__dirname, 'outputs', outputFilename);

    // Ensure outputs directory exists
    if (!fs.existsSync(path.dirname(outputPath))) {
      fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    }

    // Call Python backend
    const pythonScript = path.join(__dirname, '../pythonBackend/main.py');
    const command = `python "${pythonScript}" "${req.file.path}" "${outputPath}"`;

    exec(command, (error, stdout, stderr) => {
      // Clean up uploaded file regardless of result
      fs.unlink(req.file.path, () => {});

      if (error) {
        console.error('Python error:', stderr);
        return res.status(500).json({ error: 'Conversion failed', details: stderr });
      }

      if (!fs.existsSync(outputPath)) {
        return res.status(500).json({ error: 'Conversion failed - no output generated' });
      }

      res.json({
        success: true,
        downloadUrl: `/api/download/${outputFilename}`,
        filename: outputFilename
      });
    });

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Server error occurred' });
  }
});

app.get('/api/download/:filename', (req, res) => {
  const filePath = path.join(__dirname, 'outputs', req.params.filename);

  if (fs.existsSync(filePath)) {
    res.download(filePath, (err) => {
      if (err) console.error('Download error:', err);
      // Optionally clean up after download
      fs.unlink(filePath, () => {});
    });
  } else {
    res.status(404).json({ error: 'File not found' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
const express = require("express");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const fs = require("fs");
const cors = require("cors");
const PptxGenJS = require("pptxgenjs");

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

const storage = multer.diskStorage({
    destination: "uploads/",
    filename: (req, file, cb) => cb(null, file.originalname),
});

const upload = multer({ storage });

app.post("/upload", upload.single("file"), async (req, res) => {
    try {
        const filePath = req.file.path;
        const fileType = req.file.mimetype;
        let extractedText = "";

        if (fileType === "text/plain") {
            extractedText = fs.readFileSync(filePath, "utf8");
        } else if (fileType === "application/pdf") {
            const pdfData = await pdfParse(fs.readFileSync(filePath));
            extractedText = pdfData.text;
        } else if (fileType.includes("word")) {
            const docxData = await mammoth.extractRawText({ path: filePath });
            extractedText = docxData.value;
        } else {
            return res.status(400).json({ message: "Unsupported file type" });
        }

        const pptx = new PptxGenJS();
        const slide = pptx.addSlide();
        slide.addText(extractedText.substring(0, 500), { x: 0.5, y: 0.5, fontSize: 18, color: "000000" });

        const pptFilePath = `uploads/${req.file.filename.replace(/\.\w+$/, "")}.pptx`;
        await pptx.writeFile({ fileName: pptFilePath });

        res.download(pptFilePath, () => {
            fs.unlinkSync(filePath);
            fs.unlinkSync(pptFilePath);
        });
    } catch (error) {
        res.status(500).json({ message: "Error processing file", error: error.message });
    }
});

app.listen(port, () => console.log(`Server running on http://localhost:${port}`));


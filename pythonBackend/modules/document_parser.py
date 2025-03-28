# modules/document_parser.py - Extract text from documents
import os
import docx
import pdfplumber
from typing import List, Dict

from modules.data_analyzer import DataAnalyzer

class DocumentParser:
    def __init__(self, filepath: str):
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"Input file not found: {filepath}")
        self.filepath = filepath

    def analyze_numerical_content(self, content=None):
        """Analyze document content for numerical data"""
        if content is None:
            content = self.extract_content()

        analyzer = DataAnalyzer()
        analyzer.extract_and_analyze(content)  # Note the corrected method name
        return analyzer

    def extract_content(self) -> List[Dict]:
        ext = os.path.splitext(self.filepath)[-1].lower()

        try:
            if ext == ".pdf":
                return self._extract_pdf()
            elif ext == ".docx":
                return self._extract_docx()
            elif ext == ".txt":
                return self._extract_txt()
            else:
                raise ValueError(f"Unsupported file format: {ext}")
        except Exception as e:
            raise Exception(f"Error processing {self.filepath}: {str(e)}")

    def _extract_pdf(self) -> List[Dict]:
        text = ""
        try:
            with pdfplumber.open(self.filepath) as pdf:
                for page in pdf.pages:
                    text += page.extract_text() or "" + "\n"
            return self._structure_content(text)
        except Exception as e:
            raise Exception(f"PDF extraction failed: {str(e)}")

    def _extract_docx(self) -> List[Dict]:
        try:
            doc = docx.Document(self.filepath)
            content = []
            for para in doc.paragraphs:
                if para.style.name.startswith("Heading"):
                    content.append("# " + para.text)  # Mark headings
                else:
                    content.append(para.text)
            return self._structure_content("\n".join(content))
        except Exception as e:
            raise Exception(f"DOCX extraction failed: {str(e)}")

    def _extract_txt(self) -> List[Dict]:
        try:
            with open(self.filepath, "r", encoding="utf-8") as file:
                return self._structure_content(file.read())
        except Exception as e:
            raise Exception(f"TXT extraction failed: {str(e)}")

    def extract_numerical_content(self):
        """Extract content with focus on numerical data sections"""
        structured = self.extract_content()
        analyzer = DataAnalyzer()
        analyzer.extract_numerical_data(structured)
        return analyzer

    def _structure_content(self, text: str) -> List[Dict]:
        sections = text.split("\n")
        structured_data = []
        current_section = {"title": "Introduction", "content": []}

        for line in sections:
            line = line.strip()
            if not line:
                continue

            if line.startswith("# "):
                if current_section["content"] or current_section["title"] != "Introduction":
                    structured_data.append(current_section)
                current_section = {"title": line[2:].strip(), "content": []}
            else:
                if line:  # Only add non-empty lines
                    current_section["content"].append(line)

        if current_section["content"] or current_section["title"] != "Introduction":
            structured_data.append(current_section)

        return structured_data
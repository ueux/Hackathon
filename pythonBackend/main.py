# main.py - Entry Point
import argparse
import os
from modules.document_parser import DocumentParser
from modules.pptx_generator import PPTXGenerator
from utils.logger import setup_logging
import sys

def validate_file(file_path, file_type="input"):
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"{file_type.capitalize()} file not found: {file_path}")


# main.py
def main(input_file, output_pptx, template=None):
    setup_logging()

    try:
        # Parse document
        parser = DocumentParser(input_file)
        content = parser.extract_content()

        # Analyze numerical data
        analyzer = parser.analyze_numerical_content(content)

        # Generate presentation
        ppt_generator = PPTXGenerator(output_pptx, template)
        ppt_generator.generate_presentation(content)

        # Add analytical slides
        analyzer.add_to_presentation(ppt_generator.presentation)

        print(f"Presentation saved to {output_pptx}")

    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Automated Document to PowerPoint Converter")
    parser.add_argument("input_file", type=str, help="Path to the input document (PDF, DOCX, TXT)")
    parser.add_argument("output_pptx", type=str, help="Path to save the generated PowerPoint file")
    parser.add_argument("--template", type=str, default=None, help="Optional PowerPoint template file")

    args = parser.parse_args()
    main(args.input_file, args.output_pptx, args.template)
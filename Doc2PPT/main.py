import argparse
import os
import sys
import uuid
from typing import Optional
from modules.document_parser import DocumentParser
from modules.pptx_generator import PPTXGenerator
from utils.logger import setup_logging
from config import Config

def validate_file(file_path: str, file_type: str = "input") -> None:
    """Validate that a file exists and is accessible."""
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"{file_type.capitalize()} file not found: {file_path}")
    if not os.access(file_path, os.R_OK):
        raise PermissionError(f"Cannot read {file_type} file: {file_path}")

def convert_document(
    input_file: str,
    output_pptx: str,
    template: Optional[str] = None,
    audience_level: str = "executive",
    presentation_length: str = "medium",
    include_summary: bool = True,
    include_appendix: bool = False
) -> dict:
    """
    Convert a document to PowerPoint with customization options.

    Args:
        input_file: Path to input document
        output_pptx: Path for output PowerPoint
        template: Optional template file path
        audience_level: Target audience level
        presentation_length: Desired presentation length
        include_summary: Whether to include summary slide
        include_appendix: Whether to include appendix

    Returns:
        Dictionary with conversion results or error information
    """
    try:
        # Validate input files
        validate_file(input_file, "input")
        if template:
            validate_file(template, "template")

        # Parse document with audience and length considerations
        parser = DocumentParser(input_file)
        content = parser.extract_content(
            audience_level=audience_level,
            content_length=presentation_length
        )

        # Generate presentation with options
        ppt_generator = PPTXGenerator(output_pptx, template)
        ppt_generator.generate_presentation(
            content,
            include_summary=include_summary,
            include_appendix=include_appendix,
            audience_level=audience_level,
            presentation_length=presentation_length
        )

        # Optionally analyze numerical content if needed
        if Config.ENABLE_ANALYTICS:
            analyzer = parser.analyze_numerical_content(content)
            analyzer.add_to_presentation(ppt_generator.presentation)
            ppt_generator.presentation.save(output_pptx)

        return {
            "success": True,
            "output_path": output_pptx,
            "message": f"Presentation saved to {output_pptx}"
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "message": f"Conversion failed: {str(e)}"
        }

def main():
    """Command-line interface for document conversion."""
    setup_logging()

    parser = argparse.ArgumentParser(
        description="Automated Document to PowerPoint Converter",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter
    )
    parser.add_argument(
        "input_file",
        type=str,
        help="Path to the input document (PDF, DOCX, TXT)"
    )
    parser.add_argument(
        "output_pptx",
        type=str,
        help="Path to save the generated PowerPoint file"
    )
    parser.add_argument(
        "--template",
        type=str,
        default=None,
        help="Optional PowerPoint template file"
    )
    parser.add_argument(
        "--audience",
        type=str,
        choices=["executive", "management", "technical"],
        default="executive",
        help="Target audience level"
    )
    parser.add_argument(
        "--length",
        type=str,
        choices=["short", "medium", "long"],
        default="medium",
        help="Presentation length"
    )
    parser.add_argument(
    "--no-summary",
    dest="include_summary",
    action="store_false",
    help="Exclude summary slide (default: include)"
    )
    parser.add_argument(
        "--appendix",
        dest="include_appendix",
        action="store_true",
        help="Include appendix (default: exclude)"
    )

    args = parser.parse_args()

    result = convert_document(
        input_file=args.input_file,
        output_pptx=args.output_pptx,
        template=args.template,
        audience_level=args.audience,
        presentation_length=args.length,
        include_summary=args.include_summary,
        include_appendix=args.include_appendix
    )

    if result["success"]:
        print(result["message"])
        sys.exit(0)
    else:
        print(result["message"], file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
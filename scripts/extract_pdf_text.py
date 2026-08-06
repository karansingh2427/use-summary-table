#!/usr/bin/env python3
"""Extract text from PDF with page numbers for label extraction."""

import sys
from pypdf import PdfReader

def extract_pdf_with_pages(pdf_path):
    """Extract text from PDF, tracking page numbers (1-indexed)."""
    reader = PdfReader(pdf_path)
    total_pages = len(reader.pages)
    
    print(f"Total pages: {total_pages}\n")
    print("=" * 80)
    
    for page_num, page in enumerate(reader.pages, start=1):
        print(f"\n{'='*80}")
        print(f"PAGE {page_num} of {total_pages}")
        print(f"{'='*80}\n")
        text = page.extract_text()
        print(text)
    
    return total_pages

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 extract_pdf_text.py <pdf_path>")
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    extract_pdf_with_pages(pdf_path)

import os
import logging
from typing import Optional, Dict, Any, Tuple
import PyPDF2
import easyocr
import numpy as np
from PIL import Image
import io
import tempfile

from app.services.section_parser import section_parser
from app.services.text_cleaner import text_cleaner

logger = logging.getLogger(__name__)


class PDFProcessor:
    def __init__(self):
        self.ocr_reader = None
        
    def _init_ocr(self):
        """Lazy initialization of EasyOCR reader"""
        if self.ocr_reader is None:
            self.ocr_reader = easyocr.Reader(['en'])
    
    def extract_text_from_pdf(self, file_path: str) -> Optional[str]:
        """Extract text from PDF, using OCR as fallback"""
        try:
            # First try PyPDF2
            text = self._extract_with_pypdf2(file_path)
            
            # If text is too short or empty, try OCR
            if not text or len(text.strip()) < 50:
                logger.info(f"PDF text extraction yielded little content, trying OCR for {file_path}")
                text = self._extract_with_ocr(file_path)
                
            return text.strip() if text else None
            
        except Exception as e:
            logger.error(f"Error processing PDF {file_path}: {e}")
            return None
    
    def extract_and_parse_pdf(self, file_path: str, parsing_method: str = "full_text", 
                            custom_headers: Optional[Dict[str, Any]] = None,
                            clean_text: bool = True, cleaning_intensity: str = "medium") -> Tuple[Optional[str], Optional[str], Optional[Dict[str, Any]]]:
        """Extract text, clean it, and optionally parse into sections"""
        try:
            # Extract raw text
            raw_text = self.extract_text_from_pdf(file_path)
            if not raw_text:
                return None, None, None
            
            # Clean and optimize text for embedding
            cleaned_text = None
            if clean_text:
                cleaned_text = text_cleaner.clean_and_optimize(
                    raw_text, 
                    intensity=cleaning_intensity,
                    max_tokens=2000
                )
                logger.info(f"Text cleaning: {len(raw_text)} -> {len(cleaned_text)} chars")
            else:
                cleaned_text = raw_text
            
            # If section-based parsing is requested
            if parsing_method == "section_based":
                # Extract filename from path
                filename = os.path.basename(file_path)
                
                # Parse into sections using cleaned text for better results
                parsed_sections = section_parser.parse_resume(
                    cleaned_text, 
                    filename=filename,
                    return_raw_sections=True
                )
                
                # If custom headers provided, override defaults
                if custom_headers and parsed_sections and 'raw_sections' in parsed_sections:
                    # TODO: Apply custom header mappings
                    pass
                
                return raw_text, cleaned_text, parsed_sections
            else:
                # Just return raw and cleaned text
                return raw_text, cleaned_text, None
                
        except Exception as e:
            logger.error(f"Error in extract_and_parse_pdf for {file_path}: {e}")
            return None, None, None
    
    def _extract_with_pypdf2(self, file_path: str) -> str:
        """Extract text using PyPDF2"""
        text = ""
        
        try:
            with open(file_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                
                for page_num in range(len(pdf_reader.pages)):
                    page = pdf_reader.pages[page_num]
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
                        
        except Exception as e:
            logger.error(f"PyPDF2 extraction failed: {e}")
            
        return text
    
    def _extract_with_ocr(self, file_path: str) -> str:
        """Extract text using EasyOCR (for image-based PDFs)"""
        try:
            self._init_ocr()
            text = ""
            
            # Convert PDF pages to images
            import pdf2image
            
            pages = pdf2image.convert_from_path(file_path, dpi=200)
            
            for i, page in enumerate(pages):
                logger.info(f"Processing page {i+1} with OCR...")
                
                # Convert PIL Image to numpy array
                page_array = np.array(page)
                
                # Run OCR
                results = self.ocr_reader.readtext(page_array)
                
                # Extract text from results
                page_text = " ".join([result[1] for result in results])
                text += page_text + "\n"
                
            return text
            
        except Exception as e:
            logger.error(f"OCR extraction failed: {e}")
            return ""
    
    def validate_pdf(self, file_path: str) -> bool:
        """Validate if file is a valid PDF"""
        try:
            with open(file_path, 'rb') as file:
                PyPDF2.PdfReader(file)
            return True
        except:
            return False


pdf_processor = PDFProcessor()
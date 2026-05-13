import io

# We will lazily load easyocr and pypdf later
reader = None

# Global OCR reader instance
_reader = None

def extract_text_from_image(image_bytes: bytes) -> str:
    global _reader
    
    if _reader is None:
        try:
            import easyocr
            _reader = easyocr.Reader(['en'], gpu=False)
        except ImportError:
            pass
        except Exception as e:
            print(f"EasyOCR init error: {e}")
            
    if _reader is None:
        try:
            import pytesseract
            from PIL import Image
            image = Image.open(io.BytesIO(image_bytes))
            text = pytesseract.image_to_string(image)
            if text.strip(): return text
        except Exception:
            pass
        return "Error: Could not process image. EasyOCR is currently installing. Please wait 1 minute and hit evaluate again."
    
    try:
        # EasyOCR reads from bytes directly
        result = _reader.readtext(image_bytes, detail=0, paragraph=True)
        return "\n".join(result)
    except Exception as e:
        print(f"Image OCR Error: {e}")
        return "Error: Could not extract text from image."

def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    try:
        import pypdf
    except ImportError:
        return "Error: Backend is currently installing required PDF parsing libraries. Please wait a moment and click evaluate again."

    try:
        # First try to extract native digital text from PDF!
        pdf_reader = pypdf.PdfReader(io.BytesIO(pdf_bytes))
        text = ""
        for page in pdf_reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
        
        if text.strip():
            return text
            
        return "Error: PDF contains no text layer (scanned image). Please upload directly as JPG/PNG for OCR."
    except Exception as e:
        print(f"PDF Parsing Error: {e}")
        return "Error: Failed to parse PDF."

def extract_text_from_word(word_bytes: bytes) -> str:
    try:
        import docx
    except ImportError:
        return "Error: Backend is currently installing required Word parsing libraries. Please wait a moment and click evaluate again."

    try:
        doc = docx.Document(io.BytesIO(word_bytes))
        full_text = []
        for para in doc.paragraphs:
            full_text.append(para.text)
        return '\n'.join(full_text)
    except Exception as e:
        print(f"Word Parsing Error: {e}")
        return "Error: Failed to parse Word document."

def process_document(file_bytes: bytes, filename: str) -> str:
    fname_lower = filename.lower()
    if fname_lower.endswith('.pdf'):
        return extract_text_from_pdf(file_bytes)
    elif fname_lower.endswith('.docx') or fname_lower.endswith('.doc'):
        return extract_text_from_word(file_bytes)
    else:
        return extract_text_from_image(file_bytes)

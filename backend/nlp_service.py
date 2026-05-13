import re
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# Lazy load sentence-transformers for semantic similarity
_model = None

def get_sentence_model():
    global _model
    if _model is None:
        try:
            from sentence_transformers import SentenceTransformer
            _model = SentenceTransformer('all-MiniLM-L6-v2')
        except ImportError:
            return None
        except Exception as e:
            print(f"Error loading sentence model: {e}")
            return None
    return _model

def get_semantic_similarity(text1: str, text2: str) -> float:
    if not text1 or not text2: return 0.0
    model = get_sentence_model()
    
    if model:
        embeddings = model.encode([text1, text2])
        similarity = cosine_similarity([embeddings[0]], [embeddings[1]])[0][0]
        return float(similarity)
    else:
        try:
            vectorizer = TfidfVectorizer(ngram_range=(1, 3), analyzer='char_wb', stop_words='english')
            tfidf_matrix = vectorizer.fit_transform([text1, text2])
            similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
            return float(similarity)
        except ValueError:
            return 0.0

def parse_section_content(text: str, schema: list) -> dict:
    """
    Splits the text into blocks based on user-defined section names in the schema.
    """
    blocks = {}
    # Sort section names by length descending to avoid partial matches
    sorted_sections = sorted(schema, key=lambda x: len(x['name']), reverse=True)
    
    # Create a regex to find ANY section name from the schema
    # Pattern: Look for Section Name (allowing some text around it like marks)
    section_patterns = [re.escape(s['name']) for s in sorted_sections]
    full_pattern = '|'.join(section_patterns)
    
    # Split text by section names, keeping the name in the results
    # Using lookahead to keep the delimiter name
    splits = re.split(f'({full_pattern})', text, flags=re.IGNORECASE)
    
    current_section = None
    for i, part in enumerate(splits):
        if i == 0: continue # Preamble before first section
        
        # If it matches a section name
        match_found = False
        for s in schema:
            if s['name'].lower() == part.strip().lower():
                current_section = s['name']
                match_found = True
                break
        
        if not match_found and current_section:
            blocks[current_section] = part
            
    return blocks

def parse_qa_tags(text: str) -> dict:
    """
    Parses Q1, A1 tags from a block of text.
    Handles formats like Q1) A1), Q1: A1:, etc.
    """
    # Find all Q and A tags with their indices
    q_matches = list(re.finditer(r'Q\s*(\d+)\s*[\):]?', text, re.IGNORECASE))
    a_matches = list(re.finditer(r'A\s*(\d+)\s*[\):]?', text, re.IGNORECASE))
    
    # Store contents
    results = {}
    
    # Helper to get text between matches
    def get_content(matches, idx, full_text):
        start = matches[idx].end()
        end = matches[idx+1].start() if idx+1 < len(matches) else len(full_text)
        # But wait, Q followed by A. We need to stop at the NEXT tag of ANY type.
        # Let's combine all matches
        all_tags = sorted(q_matches + a_matches, key=lambda x: x.start())
        
        # Find this tag in the combined list
        for t_idx, tag in enumerate(all_tags):
            if tag.start() == matches[idx].start():
                tag_end = tag.end()
                next_tag_start = all_tags[t_idx+1].start() if t_idx+1 < len(all_tags) else len(full_text)
                return full_text[tag_end:next_tag_start].strip()
        return ""

    for i in range(len(q_matches)):
        num = q_matches[i].group(1)
        results[f'Q{num}'] = get_content(q_matches, i, text)
        
    for i in range(len(a_matches)):
        num = a_matches[i].group(1)
        results[f'A{num}'] = get_content(a_matches, i, text)
        
    return results

def evaluate_advanced_logic(student_text: str, model_text: str, schema: list) -> dict:
    """
    student_text: The Master Reference Key
    model_text: The Candidate Submission
    """
    # 1. Parse into Section Blocks
    master_blocks = parse_section_content(student_text, schema)
    candidate_blocks = parse_section_content(model_text, schema)
    
    evaluation_report = []
    total_marks_obtained = 0
    total_marks_possible = 0
    format_errors = []

    for sec in schema:
        sec_name = sec['name']
        sec_marks = sec['marks']
        sec_q_count = sec['questions']
        
        m_block = master_blocks.get(sec_name, "")
        c_block = candidate_blocks.get(sec_name, "")
        
        if not m_block:
            format_errors.append(f"Section '{sec_name}' not found in Master Reference.")
            continue
        if not c_block:
            format_errors.append(f"Section '{sec_name}' not found in Candidate Submission.")
            continue
            
        # Parse Q/A from blocks
        m_qa = parse_qa_tags(m_block)
        c_qa = parse_qa_tags(c_block)
        
        # Validate count
        found_q_m = [k for k in m_qa.keys() if k.startswith('Q')]
        found_a_c = [k for k in c_qa.keys() if k.startswith('A')]
        
        if len(found_q_m) < sec_q_count:
            format_errors.append(f"Reference Error: '{sec_name}' expected {sec_q_count} questions, found {len(found_q_m)}.")
        if len(found_a_c) < sec_q_count:
            format_errors.append(f"Candidate Error: '{sec_name}' expected {sec_q_count} answers, found {len(found_a_c)}.")

        sec_results = []
        sec_score_sum = 0
        
        for i in range(1, sec_q_count + 1):
            q_tag = f'Q{i}'
            a_tag = f'A{i}'
            
            ref_q = m_qa.get(q_tag, f"Question-{i} content missing")
            ref_a = m_qa.get(a_tag, "")
            cand_a = c_qa.get(a_tag, "")
            
            similarity = get_semantic_similarity(ref_a, cand_a)
            item_score = round(similarity * sec_marks, 2)
            
            sec_results.append({
                "tag": a_tag,
                "question": ref_q,
                "ref_answer": ref_a,
                "cand_answer": cand_a,
                "similarity": round(similarity * 100, 1),
                "marks_obtained": item_score,
                "marks_possible": sec_marks
            })
            sec_score_sum += item_score
            total_marks_obtained += item_score
            total_marks_possible += sec_marks
            
        evaluation_report.append({
            "section_name": sec_name,
            "section_marks_total": sec_marks * sec_q_count,
            "section_marks_obtained": round(sec_score_sum, 2),
            "results": sec_results
        })

    if format_errors:
        return {"error": "Format Integrity Violation: " + " | ".join(format_errors)}

    return {
        "obtained_marks": round(total_marks_obtained, 2),
        "total_marks": total_marks_possible,
        "percentage": round((total_marks_obtained / total_marks_possible) * 100, 2) if total_marks_possible > 0 else 0,
        "sections": evaluation_report,
        "summary": {
            "engine": "Neural Semantic Sync v2",
            "is_semantic_active": get_sentence_model() is not None
        },
        "extracted_student_text": student_text,
        "extracted_model_text": model_text
    }

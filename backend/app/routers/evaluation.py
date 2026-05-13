import json
from fastapi import APIRouter, File, UploadFile, Form, HTTPException
from ocr_service import process_document
from nlp_service import evaluate_advanced_logic

router = APIRouter(prefix="/api", tags=["evaluation"])

@router.post("/evaluate")
async def evaluate(
    student_file: UploadFile = File(...), 
    model_file: UploadFile = File(...),
    eval_schema: str = Form(...)
):
    try:
        schema_data = json.loads(eval_schema)
        # Note: In the existing frontend logic, student_file is actually the Reference Key, 
        # and model_file is the Candidate Script. I'll maintain that naming but process correctly.
        ref_bytes = await student_file.read()
        cand_bytes = await model_file.read()
        
        ref_text = process_document(ref_bytes, student_file.filename)
        cand_text = process_document(cand_bytes, model_file.filename)
        
        result = evaluate_advanced_logic(ref_text, cand_text, schema_data)
        
        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
            
        result["extracted_student_text"] = ref_text # Reference
        result["extracted_model_text"] = cand_text # Candidate
        
        return result
    except Exception as e:
        print(f"Error processing evaluation: {e}")
        raise HTTPException(status_code=500, detail=f"Evaluation failure: {str(e)}")

@router.post("/bulk-evaluate")
async def bulk_evaluate(
    model_file: UploadFile = File(...), # Reference Key
    student_files: list[UploadFile] = File(...), # List of candidate scripts
    eval_schema: str = Form(...)
):
    try:
        schema_data = json.loads(eval_schema)
        model_bytes = await model_file.read()
        model_text = process_document(model_bytes, model_file.filename)
        
        bulk_results = []
        for file in student_files:
            try:
                from pathlib import PurePath
                # Extract just the filename without extension or directory paths
                reg_id = PurePath(file.filename).stem
                content = await file.read()
                student_text = process_document(content, file.filename)
                
                eval_result = evaluate_advanced_logic(model_text, student_text, schema_data)
                eval_result["registration_id"] = reg_id
                eval_result["filename"] = file.filename
                
                bulk_results.append(eval_result)
            except Exception as inner_e:
                bulk_results.append({
                    "registration_id": PurePath(file.filename).stem,
                    "filename": file.filename,
                    "error": str(inner_e)
                })

        
        return {
            "model_text_extracted": model_text,
            "results": bulk_results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Bulk failure: {str(e)}")

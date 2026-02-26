from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, ConfigDict
from typing import List, Optional
import httpx  # Ensure you pip install httpx

# Import your custom modules
from services.llm_exams import generate_localized_exam
from services.file_manager import save_generated_exam
from services.syllabus_manager import load_syllabus 

# Import get_model for the diagram generator
from services.new.teacher_shared import get_model 

# Initialize the router
router = APIRouter(prefix="/api/exams", tags=["Exams"])

# ==========================================
# PYDANTIC MODELS (Data Validation)
# ==========================================
class ExamBlueprint(BaseModel):
    mcq: int = 10
    true_false: int = 0
    matching: int = 0
    short_answer: int = 5
    computational: int = 0
    essay: int = 2
    case_study: int = 0

    model_config = ConfigDict(extra='ignore')

class GenerateExamRequest(BaseModel):
    uid: str
    school_id: Optional[str] = None
    school_name: Optional[str] = "Unknown School"
    school: Optional[str] = None # Added to safely catch frontend variations
    grade: str
    subject: str
    term: str
    topics: List[str]
    blueprint: ExamBlueprint

    model_config = ConfigDict(extra='ignore')

class DiagramRequest(BaseModel):
    prompt: str
    uid: Optional[str] = None
    
    model_config = ConfigDict(extra='ignore')

# ==========================================
# 1. FETCH TOPICS ROUTE
# ==========================================
@router.get("/topics", response_model=List[str])
async def get_syllabus_topics(
    grade: str = Query(..., description="E.g., Grade 6"),
    subject: str = Query(..., description="E.g., Integrated Science")
):
    """
    Fetches the official syllabus topics for a given grade and subject.
    """
    try:
        # Load the syllabus using your existing syllabus_manager
        # Hardcoding "zambia" as the country per your local context
        syllabus_data = load_syllabus(country="zambia", grade=grade, subject=subject)
        
        if not syllabus_data:
            return []

        topics_list = []
        
        # Safely extract topic names from the returned list of dictionaries
        for item in syllabus_data:
            # Check for common keys used in your JSON files for the topic name
            topic_name = item.get("topic") or item.get("title") or item.get("topic_name") or item.get("name")
            if topic_name:
                topics_list.append(str(topic_name))
                
        return topics_list

    except Exception as e:
        print(f"❌ Error fetching topics: {e}")
        raise HTTPException(status_code=500, detail="Could not load syllabus topics")


# ==========================================
# 2. GENERATE EXAM ROUTE
# ==========================================
@router.post("/generate")
async def create_exam(req: GenerateExamRequest):
    """
    Generates a localized exam using the LLM and saves it to Firestore.
    """
    try:
        # 1. Generate the Exam via the LLM Engine
        exam_data = await generate_localized_exam(
            grade=req.grade,
            subject=req.subject,
            topics=req.topics,
            blueprint=req.blueprint.model_dump() # use .dict() if on older Pydantic v1
        )

        if "error" in exam_data:
            raise HTTPException(status_code=500, detail="Failed to generate exam content")

        # 2. Save to Firestore using your dual-save manager
        save_success = save_generated_exam(
            uid=req.uid,
            subject=req.subject,
            grade=req.grade,
            term=req.term,
            school_name=req.school_name or req.school,
            exam_data=exam_data,
            school_id=req.school_id
        )

        if not save_success:
            print("⚠️ Warning: Exam generated but failed to save to Firestore.")

        # 3. Return to Frontend
        return {
            "status": "success",
            "message": "Exam generated successfully",
            "data": exam_data
        }

    except Exception as e:
        print(f"❌ Error in create_exam: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==========================================
# 3. GENERATE DIAGRAM ROUTE (WIKIMEDIA + SVG FALLBACK)
# ==========================================
@router.post("/generate-diagram")
async def create_diagram(req: DiagramRequest):
    """
    Attempts to fetch a real image from Wikimedia first.
    If it fails, falls back to generating an SVG via LLM.
    """
    print(f"\n🎨 [Diagram Generator] Processing request for: {req.prompt}")
    
# ---------------------------------------------------------
    # ATTEMPT 1: SEARCH WIKIMEDIA COMMONS
    # ---------------------------------------------------------
    image_url = None
    try:
        url = "https://commons.wikimedia.org/w/api.php"
        search_query = f"{req.prompt} diagram"
        
        params = {
            "action": "query",
            "format": "json",
            "generator": "search",
            "gsrsearch": f"filetype:bitmap|drawing {search_query}",
            "gsrlimit": 1, 
            "prop": "imageinfo",
            "iiprop": "url"
        }
        
        # 🆕 ADD THIS HEADER BLOCK
        headers = {
            "User-Agent": "Booxclash App/1.0 (booxclash@gmail.com) httpx"
        }
        
        # 🆕 PASS THE HEADERS TO HTTPX
        async with httpx.AsyncClient(headers=headers) as client:
            resp = await client.get(url, params=params, timeout=8.0)
            
            if resp.status_code == 200:
                data = resp.json()
                pages = data.get("query", {}).get("pages", {})
                if pages:
                    first_page = list(pages.values())[0]
                    image_url = first_page.get("imageinfo", [{}])[0].get("url")
            else:
                print(f"⚠️ [Wikimedia] API returned status code: {resp.status_code}")
                    
        if image_url:
            print(f"🌍 [Wikimedia] Found image: {image_url}")
            return {
                "status": "success",
                "type": "url",
                "data": image_url
            }
            
    except Exception as e:
        print(f"⚠️ [Wikimedia Search] Failed or timed out: {e}. Falling back to SVG...")

    # ---------------------------------------------------------
    # ATTEMPT 2: FALLBACK TO LLM SVG GENERATION
    # ---------------------------------------------------------
    print(f"🖍️ [SVG Generator] Falling back to AI SVG for: {req.prompt}")
    try:
        model = get_model()
        
        sys_prompt = f"""You are an expert chalkboard artist and educational illustrator.
        Your task is to draw a clean, simple, minimalist line-art diagram for a school exam paper.
        
        Prompt: {req.prompt}
        
        STRICT RULES:
        1. ONLY output valid SVG code. Do not include any text before or after.
        2. DO NOT wrap the response in markdown blocks (no ```xml or ```svg).
        3. Use simple black lines (stroke="black") and no fill (fill="none" or "white").
        4. Make it scalable (include a viewBox).
        5. Keep the design visually clear so it prints well on black-and-white paper.
        """
        
        response = await model.generate_content_async(sys_prompt)
        raw_svg = response.text.strip()
        
        # Cleanup markdown if the AI disobeys
        if raw_svg.startswith("```"):
            lines = raw_svg.split("\n")
            if lines[0].startswith("```"): lines = lines[1:]
            if lines[-1].startswith("```"): lines = lines[:-1]
            raw_svg = "\n".join(lines).strip()

        return {
            "status": "success",
            "type": "svg",
            "data": raw_svg  # Notice we are sending it under 'data' so it matches the URL response structure
        }

    except Exception as e:
        print(f"❌ Error generating diagram fallback: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate diagram")
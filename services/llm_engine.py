import os
import json
import random
import re
import httpx
import asyncio
import google.generativeai as genai
from typing import List, Dict, Any

# =====================================================
# CONFIGURE GEMINI
# =====================================================
if os.getenv("GEMINI_API_KEY"):
    genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# PRESERVED MODEL CONFIGURATIONS
MODEL_NAME = "gemini-2.5-flash" 
BUILDER_MODEL = "models/gemma-3-4b-it" 

# =====================================================
# HELPERS
# =====================================================

def _clean_json_text(text: str) -> str:
    """
    Robustly removes LLM markdown artifacts (```json) using Regex 
    to ensure valid JSON parsing.
    """
    text = text.strip()
    # Remove markdown code fences if present at start/end
    text = re.sub(r'^```json\s*', '', text, flags=re.IGNORECASE)
    text = re.sub(r'^```\s*', '', text)
    text = re.sub(r'\s*```$', '', text)
    return text.strip()


def score_title(title: str, query: str) -> int:
    """
    Relevance scorer to ensure we pick 'Structure of the Heart' 
    over 'List of heart diseases'.
    """
    title = title.lower()
    q_words = query.lower().split()
    score = 0

    # Reward keyword overlap
    for w in q_words:
        if w in title:
            score += 2

    # Penalize generic / overview pages
    penalties = ["overview", "introduction", "general", "history", "biography", "list of", "timeline"]
    for p in penalties:
        if p in title:
            score -= 3

    # Reward academic / visual indicators
    bonuses = ["diagram", "structure", "system", "map", "model", "circuit", "schematic"]
    for b in bonuses:
        if b in title:
            score += 2

    return score


# =====================================================
# AGENT 1: AI SEARCH TERM EXTRACTOR
# =====================================================

async def get_wiki_search_term(user_query: str) -> str:
    """
    Uses Gemini to translate a complex educational goal into a concise 
    Wikipedia-friendly search term.
    """
    try:
        model = genai.GenerativeModel(MODEL_NAME)
        prompt = f"""
        Task: Convert the user's educational query into the SINGLE BEST keyword to search Wikipedia for a diagram/image.
        
        User Query: "{user_query}"

        Constraints:
        1. OUTPUT ONLY THE SEARCH TERM. No quotes.
        2. Remove words like "diagram", "image", "structure", "show me".
        3. Be specific (e.g., "Human Heart" instead of "Heart").
        """
        response = await model.generate_content_async(prompt)
        # Use the regex cleaner for safety
        clean_term = _clean_json_text(response.text).replace('"', '').replace("'", "").split("\n")[0]
        return clean_term
        
    except Exception as e:
        print(f"❌ Search Term Error: {e}")
        return user_query


# =====================================================
# AGENT 2: BUILDER ACTIVITY GENERATOR
# =====================================================

async def generate_builder_json(topic: str, grade: str):
    """
    Generates a logic/sequence drag-and-drop activity.
    USES MODEL: gemma-3-4b-it
    """
    try:
        # Strictly using the specific builder model you requested
        model = genai.GenerativeModel(BUILDER_MODEL)
        
        prompt = f"""
        Create a logic-building drag-and-drop activity.
        Grade: {grade}
        Topic: {topic}

        Rules:
        1. Produce a correct sequence of 3–5 steps.
        2. Include exactly 2 incorrect distractors.
        3. Output JSON ONLY. No markdown.

        JSON Structure:
        {{
          "title": "Short Title",
          "instruction": "One sentence instruction.",
          "steps": [{{"id": "s1", "label": "Step 1"}}],
          "options": [{{"id": "s1", "label": "Step 1"}}, {{"id": "d1", "label": "Distractor"}}]
        }}
        """
        response = await model.generate_content_async(prompt)
        data = json.loads(_clean_json_text(response.text))
        
        # Shuffle options to gamify
        if "options" in data:
            random.shuffle(data["options"])
            
        return data

    except Exception as e:
        print(f"❌ Builder Error: {e}")
        return {"title": f"Review: {topic}", "steps": [], "options": []}


# =====================================================
# AGENT 3: QUIZ GENERATOR
# =====================================================

async def generate_quiz_json(topic: str, grade: str = "8"):
    try:
        model = genai.GenerativeModel(MODEL_NAME)
        prompt = f"""
        Create a 5-question multiple choice quiz about: {topic} for Grade {grade}.
        
        CRITICAL INSTRUCTIONS:
        1. "options" must be an array of 4 strings.
        2. "correctAnswer" must be the EXACT string text from the "options" array.
        3. Output valid JSON only.

        OUTPUT JSON:
        {{
          "title": "Quiz Title",
          "questions": [
            {{
              "question": "Question text here?",
              "options": ["A", "B", "C", "D"],
              "correctAnswer": "B",
              "explanation": "Why B is correct."
            }}
          ]
        }}
        """
        response = await model.generate_content_async(prompt)
        return json.loads(_clean_json_text(response.text))
    except Exception as e:
        print(f"❌ Quiz Error: {e}")
        return {"title": "Quiz Unavailable", "questions": []}


# =====================================================
# AGENT 4: STORY NARRATIVE GENERATOR
# =====================================================

async def generate_narrative_lesson(topic: str, grade: str):
    """
    Generates a 'Story Mode' lesson.
    """
    try:
        model = genai.GenerativeModel(MODEL_NAME)
        prompt = f"""
        Write a short educational adventure story to explain "{topic}" to a {grade}th grade student.
        
        Structure:
        1. Engaging Introduction.
        2. 3 distinct Chapters using analogies.
        3. Output valid JSON ONLY.

        JSON Structure:
        {{
            "title": "Adventure Title",
            "introduction": "Hook paragraph.",
            "chapters": [
                {{"heading": "Chapter 1", "content": "..."}},
                {{"heading": "Chapter 2", "content": "..."}},
                {{"heading": "Chapter 3", "content": "..."}}
            ]
        }}
        """
        response = await model.generate_content_async(prompt)
        return json.loads(_clean_json_text(response.text))
    except Exception as e:
        print(f"❌ Narrative Error: {e}")
        return {"title": topic, "introduction": "Story unavailable.", "chapters": []}


# =====================================================
# AGENT 5: SMART IMAGE RETRIEVAL (WIKIPEDIA)
# =====================================================

async def generate_fast_image(user_query: str):
    """
    Fetches high-quality thumbnails from Wikipedia with relevance scoring.
    """
    # 1. Optimize query using LLM
    optimized_query = await get_wiki_search_term(user_query)
    print(f"🖼️  Image Search: '{user_query}' -> '{optimized_query}'")

    search_url = "https://en.wikipedia.org/w/api.php"
    headers = {"User-Agent": "EducationalAI/2.0 (booxclash@gmail.com)"}

    async with httpx.AsyncClient(headers=headers, timeout=10.0) as client:
        try:
            # 2. Strict Title Search (Best for diagrams)
            strict_params = {
                "action": "query", "format": "json", "list": "search", 
                "srsearch": f'intitle:"{optimized_query}"', "srlimit": 5
            }
            resp = await client.get(search_url, params=strict_params)
            results = resp.json().get("query", {}).get("search", [])

            # 3. Fallback to Relaxed Search if strict fails
            if not results:
                relaxed_params = {
                    "action": "query", "format": "json", "list": "search", 
                    "srsearch": optimized_query, "srlimit": 5
                }
                resp = await client.get(search_url, params=relaxed_params)
                results = resp.json().get("query", {}).get("search", [])

            if not results:
                print(f"⚠️ No results for {optimized_query}")
                return None

            # 4. Rank results using scoring helper
            ranked = sorted(
                results,
                key=lambda r: score_title(r["title"], optimized_query),
                reverse=True
            )
            best_page_title = ranked[0]["title"]

            # 5. Fetch Image URL
            img_params = {
                "action": "query", "format": "json", "titles": best_page_title, 
                "prop": "pageimages", "pithumbsize": 1000 
            }
            img_resp = await client.get(search_url, params=img_params)
            pages = img_resp.json().get("query", {}).get("pages", {})
            
            # Helper to get first value from dict safely
            if not pages:
                return None
                
            page_content = next(iter(pages.values()))
            
            thumb = page_content.get("thumbnail")
            if thumb:
                img_url = thumb["source"]
                # Fix protocol if missing
                return "https:" + img_url if img_url.startswith("//") else img_url
            
            return None

        except Exception as e:
            print(f"❌ Image Fetch Error: {e}")
            return None


# =====================================================
# AGENT 6: MISTAKE ANALYZER
# =====================================================

async def analyze_quiz_remediation(topic: str, mistakes: list, grade: str = "8"):
    """
    Analyzes quiz mistakes and returns a short, encouraging explanation text.
    """
    if not mistakes:
        return "Great job! You seem to understand the core concepts well."

    try:
        model = genai.GenerativeModel(MODEL_NAME)
        
        # Convert mistakes list to string for prompt
        mistakes_text = "\n".join([f"Q: {m['question']} | Student Answered: {m['userAnswer']} | Correct: {m['correctAnswer']}" for m in mistakes])
        
        prompt = f"""
        You are a supportive tutor for a Grade {grade} student.
        Topic: {topic}
        
        The student made these mistakes on a quiz:
        {mistakes_text}
        
        Task: Write a short (2-3 sentences) encouraging paragraph explaining WHY the correct answers are correct and clearing up the specific misunderstanding. 
        Talk directly to the student ("You thought X, but actually...").
        Do NOT list the questions one by one. Synthesize the feedback.
        """
        
        response = await model.generate_content_async(prompt)
        return response.text.strip()
    except Exception as e:
        print(f"❌ Analysis Error: {e}")
        return "Let's review the topic again to clarify those tricky points."


# =====================================================
# AGENT 7: SCHEME OF WORK GENERATOR (INTELLIGENT)
# =====================================================

async def generate_scheme_with_ai(
    syllabus_data: List[Dict[str, Any]], 
    subject: str, 
    grade: str, 
    term: str, 
    num_weeks: int
) -> List[Dict[str, Any]]:
    """
    Uses AI to intelligently distribute syllabus topics across the available weeks.
    """
    
    # 1. Convert syllabus to a compact string for the prompt
    # Limit to first ~25-30 topics to save tokens, or send whole thing if Flash model
    syllabus_context = json.dumps(syllabus_data[:35]) 
    
    prompt = f"""
    You are an expert Head Teacher and Curriculum Planner for the Zambian Syllabus.
    
    TASK:
    Create a detailed Scheme of Work for:
    - Subject: {subject}
    - Grade: {grade}
    - Term: {term}
    - Duration: {num_weeks} Weeks
    
    INPUT SYLLABUS DATA:
    {syllabus_context}

    INSTRUCTIONS:
    1. Distribute the syllabus topics logically across {num_weeks} weeks.
    2. Group related small topics into one week, or split complex topics across multiple weeks.
    3. Ensure "Week 1" is usually "Orientation/Intro" if appropriate, or start straight away.
    4. Ensure the last week (Week {num_weeks}) is "Revision and End of Term Tests".
    5. You MUST return strictly valid JSON.

    REQUIRED JSON STRUCTURE (Array of Objects):
    [
      {{
        "week": "Week 1",
        "topic": "Topic Title",
        "content": ["Detail 1", "Detail 2"],
        "outcomes": ["The student should be able to..."],
        "references": ["Approved Textbooks"],
        "isSpecialRow": false
      }},
      ...
      {{
         "week": "Week {num_weeks}",
         "content": ["REVISION AND EXAMS"],
         "isSpecialRow": true
      }}
    ]
    """

    try:
        # Use a model capable of handling larger contexts well (Flash models are great for this)
        model = genai.GenerativeModel("gemini-2.5-flash") 
        
        response = await model.generate_content_async(prompt)
        
        # Robustly clean the response
        clean_text = _clean_json_text(response.text)
        data = json.loads(clean_text)
        
        # Handle cases where LLM wraps it in a key like {"scheme": [...]}
        if isinstance(data, dict):
            # Look for common keys or just take the first list value found
            for key, value in data.items():
                if isinstance(value, list):
                    return value
            return [] # Fallback
            
        return data # If it's already a list

    except Exception as e:
        print(f"❌ AI Scheme Gen Error: {e}")
        # Return empty list triggers the fallback in the router
        return []
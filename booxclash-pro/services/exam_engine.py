import random
from pathlib import Path

# Point to your new folder
BASE_DIR = Path(__file__).resolve().parent.parent
PAPERS_DIR = BASE_DIR / "past_papers"

def generate_exam(subject: str, grade: str):
    filename = f"grade{grade}_{subject.lower().replace(' ', '_')}.txt"
    file_path = PAPERS_DIR / filename

    if not file_path.exists():
        return {"error": "Paper not found", "questions": []}

    questions = []
    current_q = {}

    # Simple Parser for your .txt format
    with open(file_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line == "[QUESTION]":
                if current_q: questions.append(current_q)
                current_q = {}
            elif line.startswith("ID:"): current_q['id'] = line.split(": ", 1)[1]
            elif line.startswith("TEXT:"): current_q['text'] = line.split(": ", 1)[1]
            elif line.startswith("IMAGE:"): 
                val = line.split(": ", 1)[1]
                current_q['image'] = None if val == "null" else val
            elif line.startswith("OPTION_A:"): current_q['A'] = line.split(": ", 1)[1]
            elif line.startswith("OPTION_B:"): current_q['B'] = line.split(": ", 1)[1]
            elif line.startswith("OPTION_C:"): current_q['C'] = line.split(": ", 1)[1]
            elif line.startswith("OPTION_D:"): current_q['D'] = line.split(": ", 1)[1]
            elif line.startswith("ANSWER:"): current_q['answer'] = line.split(": ", 1)[1]

        if current_q: questions.append(current_q) # Add last one

    # Randomize order for the "Exam Feel"
    random.shuffle(questions)
    return {"subject": subject, "grade": grade, "questions": questions[:10]} # Limit to 10 for now
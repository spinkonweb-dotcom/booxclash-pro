from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

# --- Request Models (What comes IN) ---

class SimulationRequest(BaseModel):
    grade: str = Field(..., example="7")
    subject: str = Field(..., example="Science")
    topic: str = Field(..., example="Density")
    action: str = Field(..., example="create_lab_density")

class VoiceToolCall(BaseModel):
    """
    Structure of the data sent BY the ElevenLabs Agent
    when it wants to trigger an action on your server.
    """
    tool_name: str
    parameters: Dict[str, Any]

# --- Response Models (What goes OUT) ---

class SyllabusContext(BaseModel):
    topic: str
    learning_objective: str
    key_concepts: List[str]
    context_text: str

class SimulationResponse(BaseModel):
    topic: str
    ui_code: str  # The generated React code
    context: SyllabusContext
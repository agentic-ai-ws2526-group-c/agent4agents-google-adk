"""
Single COMPASS agent that recommends the best AI framework based on structured form input.
No follow-up questions — delivers a direct recommendation with guaranteed JSON output.
"""
from pathlib import Path
from pydantic import BaseModel, Field
from google.adk.agents import LlmAgent
from .infra import logger


# --- Structured Output Schema ---
class FrameworkRecommendation(BaseModel):
    framework: str = Field(
        description="Name des empfohlenen Frameworks (exakt einer von: N8N, Cognigy, Google ADK, CrewAI, OpenAI SDK, Claude SDK, LangChain, LangGraph, Keine KI nötig)"
    )
    ease_of_use: str = Field(description="Bewertung: High, Medium oder Hard")
    summary: str = Field(description="Ein-Satz-Zusammenfassung der Empfehlung")
    reasoning: str = Field(
        description="Ausführliche Begründung der Entscheidung (3-5 Sätze)"
    )
    ki_notwendig: bool = Field(
        description="True wenn KI notwendig ist, False wenn deterministisch lösbar"
    )
    alternative_ohne_ki: str = Field(
        default="",
        description="Vorschlag ohne KI, falls ki_notwendig=false. Sonst leer.",
    )


# --- Load COMPASS Prompt ---
BASE_DIR = Path(__file__).parent
PROMPTS_DIR = BASE_DIR / "prompts"
COMPASS_PROMPT_PATH = PROMPTS_DIR / "compass.txt"

try:
    compass_instruction = COMPASS_PROMPT_PATH.read_text(encoding="utf-8")
    logger.info("COMPASS prompt loaded successfully.")
except Exception as e:
    logger.error(f"Failed to load COMPASS prompt: {e}")
    raise e

# --- Single Agent ---
root_agent = LlmAgent(
    name="CompassAgent",
    model="gemini-3-flash-preview",
    instruction=compass_instruction,
    description="Empfiehlt exakt ein KI-Framework basierend auf strukturiertem Formular-Input. Keine Rückfragen.",
    output_key="recommendation",
    output_schema=FrameworkRecommendation,
)
    



"""
Two-agent pipeline: CompassAgent recommends → JudgeAgent evaluates.
Uses Google ADK SequentialAgent for orchestration (LLM-as-a-Judge pattern).
"""
from pathlib import Path
from pydantic import BaseModel, Field
from google.adk.agents import LlmAgent, SequentialAgent
from .infra import logger


# --- Structured Output Schemas ---

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


class JudgeEvaluation(BaseModel):
    score: int = Field(
        description="Gesamtbewertung der Empfehlungsqualität auf einer Skala von 1-10",
        ge=1,
        le=10,
    )
    strengths: list[str] = Field(
        description="Liste der Stärken der Empfehlung (mindestens 2)"
    )
    weaknesses: list[str] = Field(
        description="Liste der Schwächen oder Bedenken (leeres Array falls keine)"
    )
    improvement_suggestions: list[str] = Field(
        description="Konkrete Verbesserungsvorschläge (mindestens 1)"
    )
    framework_fit: str = Field(
        description="1-2 Sätze ob und warum das Framework zum Use Case passt"
    )
    ease_of_use_realistic: bool = Field(
        description="True wenn die Ease-of-Use-Bewertung realistisch ist"
    )


# --- Load Prompts ---
BASE_DIR = Path(__file__).parent
PROMPTS_DIR = BASE_DIR / "prompts"

try:
    compass_instruction = (PROMPTS_DIR / "compass.txt").read_text(encoding="utf-8")
    judge_instruction = (PROMPTS_DIR / "judge.txt").read_text(encoding="utf-8")
    logger.info("Prompts loaded successfully (COMPASS + Judge).")
except Exception as e:
    logger.error(f"Failed to load prompts: {e}")
    raise e

# --- Stage 1: CompassAgent (Framework-Empfehlung) ---
compass_agent = LlmAgent(
    name="CompassAgent",
    model="gemini-3-flash-preview",
    instruction=compass_instruction,
    description="Empfiehlt exakt ein KI-Framework basierend auf strukturiertem Formular-Input. Keine Rückfragen.",
    output_key="recommendation",
    output_schema=FrameworkRecommendation,
)

# --- Stage 2: JudgeAgent (Qualitätsbewertung) ---
judge_agent = LlmAgent(
    name="JudgeAgent",
    model="gemini-3-flash-preview",
    instruction=judge_instruction,
    description="Bewertet die Qualität der Framework-Empfehlung des CompassAgent anhand von Framework-Fit, Ease-of-Use-Realismus, Begründungsqualität und Alternativen-Check.",
    output_key="judge_evaluation",
    output_schema=JudgeEvaluation,
)

# --- Pipeline: root_agent for ADK discovery ---
root_agent = SequentialAgent(
    name="RecommendationPipeline",
    sub_agents=[compass_agent, judge_agent],
    description="Sequentielle Pipeline: Erst Framework-Empfehlung durch CompassAgent, dann Qualitätsbewertung durch JudgeAgent.",
)
    



"""
Single COMPASS agent that recommends the best AI framework based on structured form input.
No follow-up questions — delivers a direct recommendation.
"""
from pathlib import Path
from google.adk.agents import LlmAgent
from .infra import logger

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
)
    



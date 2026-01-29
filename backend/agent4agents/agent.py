"""
This module defines the Agent4Agents using the Google ADK. It's job is to get greet the User, find out the user's needs, 
find out the user's knowledge level, and then to give the user recommendations on what framework or application to use 
to build their AI agent. After that it should offer to help the user build the AI agent using the recommended framework or application.
"""
import os
from pathlib import Path
from google.adk.agents import LlmAgent
from google.adk.tools import AgentTool
from .infra import PromptManager, SimpleCache, async_retry, logger

# --- Setup Optimization Infrastructure ---
BASE_DIR = Path(__file__).parent
PROMPTS_DIR = BASE_DIR / "prompts"
prompt_manager = PromptManager(str(PROMPTS_DIR))

# --- Load Prompts (Supports A/B Testing) ---
try:
    knowledge_finding_instruction = prompt_manager.load_prompt("knowledge_finding")
    recommendation_instruction = prompt_manager.load_prompt("recommendation")
    logger.info("Prompts loaded successfully.")
except Exception as e:
    logger.error(f"Failed to load prompts: {e}")
    # Fallback/Default prompts could be defined here, but for now we raise
    raise e

# --- Agents ---

knowledge_finding_agent = LlmAgent(
    name="KnowledgeFindingAgent",
    model="gemini-3-flash-preview",
    instruction=knowledge_finding_instruction,
    description="Returns a JSON object assessing if the user can implement the solution. Input: {proposed_tool, user_info}. Output: JSON.",
    output_key="knowledge_level",
)

recommendation_agent = LlmAgent(
    name="RecommendationAgent",
    model="gemini-3-flash-preview",
    instruction=recommendation_instruction,
    description="An agent that recommends AI agent frameworks or applications based on user needs and knowledge level.",
    output_key="recommendation",
    tools=[AgentTool(knowledge_finding_agent)]
)

root_agent = recommendation_agent
    



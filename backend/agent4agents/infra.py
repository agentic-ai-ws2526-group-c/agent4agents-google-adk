import logging
import asyncio
import random
import json
import functools
from typing import Any, Callable, Dict, Optional, List
from pathlib import Path

# --- Logging ---
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("AgentInfra")

# --- Caching ---
class SimpleCache:
    _cache: Dict[str, Any] = {}

    @classmethod
    def get(cls, key: str) -> Optional[Any]:
        val = cls._cache.get(key)
        if val:
            logger.info(f"Cache hit for key: {key}")
        return val

    @classmethod
    def set(cls, key: str, value: Any):
        logger.info(f"Cache set for key: {key}")
        cls._cache[key] = value

def memoize(func):
    """Simple in-memory caching decorator for async functions."""
    @functools.wraps(func)
    async def wrapper(*args, **kwargs):
        key = f"{func.__name__}:{json.dumps(args, sort_keys=True)}:{json.dumps(kwargs, sort_keys=True)}"
        cached = SimpleCache.get(key)
        if cached:
            return cached
        result = await func(*args, **kwargs)
        SimpleCache.set(key, result)
        return result
    return wrapper

# --- Retry Logic ---
def async_retry(retries: int = 3, delay: float = 1.0):
    """Decorator to retry async functions."""
    def decorator(func):
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            last_exception = None
            for attempt in range(retries):
                try:
                    return await func(*args, **kwargs)
                except Exception as e:
                    last_exception = e
                    logger.warning(f"Attempt {attempt + 1}/{retries} failed for {func.__name__}: {e}")
                    await asyncio.sleep(delay * (2 ** attempt))  # Exponential backoff
            logger.error(f"All {retries} attempts failed for {func.__name__}.")
            raise last_exception
        return wrapper
    return decorator

# --- Prompt Management & A/B Testing ---
class PromptManager:
    def __init__(self, prompts_dir: str):
        self.prompts_dir = Path(prompts_dir)
        self.prompts: Dict[str, List[str]] = {}

    def load_prompt(self, name: str) -> str:
        """Loads a prompt. Supports A/B testing by picking a random variant if multiple files exist (e.g., prompt_v1.txt, prompt_v2.txt)."""
        # Simple glob for variants
        variants = list(self.prompts_dir.glob(f"{name}_v*.txt"))
        if not variants:
            # Fallback to exact match
            fpath = self.prompts_dir / f"{name}.txt"
            if fpath.exists():
                return fpath.read_text(encoding="utf-8")
            raise FileNotFoundError(f"No prompt found for '{name}' in {self.prompts_dir}")
        
        # A/B Test Selection
        selected = random.choice(variants)
        logger.info(f"Selected prompt variant: {selected.name}")
        return selected.read_text(encoding="utf-8")

# --- Parallel Execution ---
async def run_parallel(*tasks):
    """Runs multiple awaitables in parallel and returns results."""
    logger.info(f"Running {len(tasks)} tasks in parallel...")
    results = await asyncio.gather(*tasks, return_exceptions=True)
    return results

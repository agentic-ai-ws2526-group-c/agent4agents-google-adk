"""
Framework Capability Matrix — deterministic scoring tool for the CompassAgent.

The CompassAgent calls `score_frameworks(...)` with extracted use-case
requirements.  The tool returns a ranked list of frameworks with numeric
scores.  This removes guesswork from the heuristic prompt logic and makes
the decision auditable.
"""

from __future__ import annotations

# ──────────────────────────────────────────────────────────
# Capability dimensions  (each scored 0-3 per framework)
#   0 = not supported / not applicable
#   1 = basic / limited support
#   2 = good support
#   3 = excellent / native strength
# ──────────────────────────────────────────────────────────

FRAMEWORKS: dict[str, dict[str, int]] = {
    "N8N": {
        "simple_api_integration": 3,
        "complex_api_orchestration": 2,
        "legacy_no_api": 0,
        "web_scraping_heterogeneous": 1,
        "chatbot_conversation": 1,
        "background_automation": 3,
        "nlp_sentiment_multilingual": 0,
        "nlp_topic_clustering": 0,
        "stateful_pipelines": 1,
        "multi_agent_collaboration": 0,
        "custom_ml_integration": 0,
        "low_code_speed": 3,
        "granular_code_control": 0,
        "error_handling_complex": 1,
        "realtime_streaming": 1,
        "multimodal_video_audio": 0,
    },
    "Cognigy": {
        "simple_api_integration": 2,
        "complex_api_orchestration": 1,
        "legacy_no_api": 0,
        "web_scraping_heterogeneous": 0,
        "chatbot_conversation": 3,
        "background_automation": 1,
        "nlp_sentiment_multilingual": 1,
        "nlp_topic_clustering": 0,
        "stateful_pipelines": 1,
        "multi_agent_collaboration": 0,
        "custom_ml_integration": 0,
        "low_code_speed": 3,
        "granular_code_control": 0,
        "error_handling_complex": 1,
        "realtime_streaming": 2,
        "multimodal_video_audio": 1,
    },
    "Google ADK": {
        "simple_api_integration": 2,
        "complex_api_orchestration": 2,
        "legacy_no_api": 2,
        "web_scraping_heterogeneous": 2,
        "chatbot_conversation": 2,
        "background_automation": 2,
        "nlp_sentiment_multilingual": 2,
        "nlp_topic_clustering": 2,
        "stateful_pipelines": 2,
        "multi_agent_collaboration": 3,
        "custom_ml_integration": 2,
        "low_code_speed": 1,
        "granular_code_control": 2,
        "error_handling_complex": 2,
        "realtime_streaming": 3,
        "multimodal_video_audio": 3,
    },
    "CrewAI": {
        "simple_api_integration": 2,
        "complex_api_orchestration": 2,
        "legacy_no_api": 2,
        "web_scraping_heterogeneous": 2,
        "chatbot_conversation": 1,
        "background_automation": 2,
        "nlp_sentiment_multilingual": 2,
        "nlp_topic_clustering": 2,
        "stateful_pipelines": 2,
        "multi_agent_collaboration": 3,
        "custom_ml_integration": 2,
        "low_code_speed": 1,
        "granular_code_control": 2,
        "error_handling_complex": 2,
        "realtime_streaming": 1,
        "multimodal_video_audio": 0,
    },
    "OpenAI SDK": {
        "simple_api_integration": 2,
        "complex_api_orchestration": 2,
        "legacy_no_api": 2,
        "web_scraping_heterogeneous": 2,
        "chatbot_conversation": 2,
        "background_automation": 2,
        "nlp_sentiment_multilingual": 3,
        "nlp_topic_clustering": 2,
        "stateful_pipelines": 1,
        "multi_agent_collaboration": 1,
        "custom_ml_integration": 2,
        "low_code_speed": 0,
        "granular_code_control": 3,
        "error_handling_complex": 2,
        "realtime_streaming": 2,
        "multimodal_video_audio": 2,
    },
    "Claude SDK": {
        "simple_api_integration": 2,
        "complex_api_orchestration": 2,
        "legacy_no_api": 2,
        "web_scraping_heterogeneous": 2,
        "chatbot_conversation": 2,
        "background_automation": 2,
        "nlp_sentiment_multilingual": 3,
        "nlp_topic_clustering": 2,
        "stateful_pipelines": 1,
        "multi_agent_collaboration": 1,
        "custom_ml_integration": 2,
        "low_code_speed": 0,
        "granular_code_control": 3,
        "error_handling_complex": 2,
        "realtime_streaming": 1,
        "multimodal_video_audio": 1,
    },
    "LangChain": {
        "simple_api_integration": 2,
        "complex_api_orchestration": 3,
        "legacy_no_api": 3,
        "web_scraping_heterogeneous": 3,
        "chatbot_conversation": 2,
        "background_automation": 2,
        "nlp_sentiment_multilingual": 3,
        "nlp_topic_clustering": 3,
        "stateful_pipelines": 2,
        "multi_agent_collaboration": 2,
        "custom_ml_integration": 3,
        "low_code_speed": 0,
        "granular_code_control": 3,
        "error_handling_complex": 2,
        "realtime_streaming": 1,
        "multimodal_video_audio": 1,
    },
    "LangGraph": {
        "simple_api_integration": 2,
        "complex_api_orchestration": 3,
        "legacy_no_api": 3,
        "web_scraping_heterogeneous": 3,
        "chatbot_conversation": 2,
        "background_automation": 3,
        "nlp_sentiment_multilingual": 3,
        "nlp_topic_clustering": 3,
        "stateful_pipelines": 3,
        "multi_agent_collaboration": 3,
        "custom_ml_integration": 3,
        "low_code_speed": 0,
        "granular_code_control": 3,
        "error_handling_complex": 3,
        "realtime_streaming": 2,
        "multimodal_video_audio": 1,
    },
}

# Human-friendly descriptions for each capability dimension
CAPABILITY_DESCRIPTIONS: dict[str, str] = {
    "simple_api_integration": "Einfache REST-API-Anbindung",
    "complex_api_orchestration": "Komplexe API-Orchestrierung (mehrere Quellen, Transformation)",
    "legacy_no_api": "Legacy-Systeme ohne Schnittstellen (DB, Dateisystem, proprietäre Protokolle)",
    "web_scraping_heterogeneous": "Web-Scraping heterogener Quellen",
    "chatbot_conversation": "Chatbot / Konversation",
    "background_automation": "Hintergrundprozess / Automatisierung",
    "nlp_sentiment_multilingual": "Multilinguales NLP / Sentiment-Analyse",
    "nlp_topic_clustering": "Topic-Extraction / Clustering",
    "stateful_pipelines": "Stateful Pipelines mit komplexer Fehlerbehandlung",
    "multi_agent_collaboration": "Multi-Agenten-Kollaboration",
    "custom_ml_integration": "Custom ML / eigene Modelle einbinden",
    "low_code_speed": "Schnelle Low-Code-Umsetzung",
    "granular_code_control": "Granulare Code-Kontrolle",
    "error_handling_complex": "Robuste Fehlerbehandlung bei komplexen Workflows",
    "realtime_streaming": "Echtzeit-Streaming / Live-Interaktion",
    "multimodal_video_audio": "Multimodale Verarbeitung (Video, Audio, Bild)",
}


def score_frameworks(
    needs_simple_api: bool = False,
    needs_complex_api: bool = False,
    needs_legacy_no_api: bool = False,
    needs_web_scraping: bool = False,
    needs_chatbot: bool = False,
    needs_background_automation: bool = False,
    needs_nlp_sentiment: bool = False,
    needs_nlp_topic_clustering: bool = False,
    needs_stateful_pipelines: bool = False,
    needs_multi_agent: bool = False,
    needs_custom_ml: bool = False,
    prefers_low_code: bool = False,
    needs_granular_control: bool = False,
    needs_error_handling: bool = False,
    needs_realtime: bool = False,
    needs_multimodal: bool = False,
) -> dict:
    """Bewertet alle verfügbaren Frameworks anhand der extrahierten Anforderungen des Use Cases.

    Übergib für jede zutreffende Anforderung `True`. Das Tool gibt ein
    Ranking aller Frameworks mit Scores und einer Erklärung der Top-3
    zurück. Nutze dieses Ergebnis als **Entscheidungsgrundlage** für
    deine Framework-Empfehlung.

    Args:
        needs_simple_api: Einfache REST-API-Anbindung nötig
        needs_complex_api: Komplexe API-Orchestrierung (mehrere Quellen, Transformation)
        needs_legacy_no_api: Legacy-Systeme ohne direkte Schnittstellen
        needs_web_scraping: Web-Scraping von heterogenen Webquellen
        needs_chatbot: Chatbot / Konversations-Interface
        needs_background_automation: Hintergrundprozess / Automatisierung
        needs_nlp_sentiment: Multilinguales NLP / Sentiment-Analyse
        needs_nlp_topic_clustering: Topic-Extraction / Clustering
        needs_stateful_pipelines: Stateful Pipeline mit komplexer Fehlerbehandlung
        needs_multi_agent: Multi-Agenten-Kollaboration
        needs_custom_ml: Custom ML / eigene Modelle einbinden
        prefers_low_code: Nutzer bevorzugt schnelle Low-Code-Umsetzung
        needs_granular_control: Maximale Code-Kontrolle nötig
        needs_error_handling: Robuste Fehlerbehandlung in komplexen Workflows
        needs_realtime: Echtzeit-Streaming / Live-Interaktion
        needs_multimodal: Multimodale Verarbeitung (Video, Audio, Bild)

    Returns:
        dict mit:
          - ranking: Liste sortiert nach Score (höchster zuerst)
          - top_recommendation: Name des bestbewerteten Frameworks
          - explanation: Erklärung warum die Top-3 gut passen
    """

    # Map boolean flags to capability keys
    requirement_map: dict[str, bool] = {
        "simple_api_integration": needs_simple_api,
        "complex_api_orchestration": needs_complex_api,
        "legacy_no_api": needs_legacy_no_api,
        "web_scraping_heterogeneous": needs_web_scraping,
        "chatbot_conversation": needs_chatbot,
        "background_automation": needs_background_automation,
        "nlp_sentiment_multilingual": needs_nlp_sentiment,
        "nlp_topic_clustering": needs_nlp_topic_clustering,
        "stateful_pipelines": needs_stateful_pipelines,
        "multi_agent_collaboration": needs_multi_agent,
        "custom_ml_integration": needs_custom_ml,
        "low_code_speed": prefers_low_code,
        "granular_code_control": needs_granular_control,
        "error_handling_complex": needs_error_handling,
        "realtime_streaming": needs_realtime,
        "multimodal_video_audio": needs_multimodal,
    }

    active_requirements = {k for k, v in requirement_map.items() if v}

    if not active_requirements:
        return {
            "ranking": [],
            "top_recommendation": "Keine KI nötig",
            "explanation": "Es wurden keine spezifischen Anforderungen identifiziert.",
        }

    # Score each framework
    scores: dict[str, dict] = {}
    for fw_name, capabilities in FRAMEWORKS.items():
        total = 0
        matched: list[str] = []
        weak: list[str] = []
        missing: list[str] = []

        for req in active_requirements:
            cap_score = capabilities.get(req, 0)
            total += cap_score
            desc = CAPABILITY_DESCRIPTIONS.get(req, req)
            if cap_score >= 2:
                matched.append(desc)
            elif cap_score == 1:
                weak.append(desc)
            else:
                missing.append(desc)

        max_possible = len(active_requirements) * 3
        percentage = round(total / max_possible * 100) if max_possible > 0 else 0

        scores[fw_name] = {
            "score": total,
            "percentage": percentage,
            "matched": matched,
            "weak": weak,
            "missing": missing,
        }

    # Sort by score descending
    ranking = sorted(scores.items(), key=lambda x: x[1]["score"], reverse=True)

    # Build explanation for top 3
    explanation_parts: list[str] = []
    for i, (fw, data) in enumerate(ranking[:3]):
        strengths = ", ".join(data["matched"][:3]) if data["matched"] else "keine"
        gaps = ", ".join(data["missing"][:2]) if data["missing"] else "keine"
        explanation_parts.append(
            f"{i+1}. **{fw}** ({data['percentage']}%): "
            f"Stärken: {strengths}. "
            f"Lücken: {gaps}."
        )

    return {
        "ranking": [
            {"framework": fw, **data} for fw, data in ranking
        ],
        "top_recommendation": ranking[0][0] if ranking else "Keine KI nötig",
        "explanation": "\n".join(explanation_parts),
    }

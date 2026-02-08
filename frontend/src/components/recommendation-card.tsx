"use client";

import { Button } from "@/components/ui/button";
import { ExternalLink, Bot, Users, Download, Copy, Check } from "lucide-react";
import { useState } from "react";

// --- Framework metadata: docs URLs and context7 agent URLs ---
const FRAMEWORK_META: Record<
  string,
  { docsUrl: string; context7Url: string; color: string; icon: string }
> = {
  N8N: {
    docsUrl: "https://docs.n8n.io/",
    context7Url: "https://context7.com/n8n-io/n8n",
    color: "#EA4B71",
    icon: "🔗",
  },
  Cognigy: {
    docsUrl: "https://docs.cognigy.com/",
    context7Url: "https://context7.com/cognigy",
    color: "#0F4C81",
    icon: "💬",
  },
  "Google ADK": {
    docsUrl: "https://google.github.io/adk-docs/",
    context7Url: "https://context7.com/google/adk-python",
    color: "#4285F4",
    icon: "☁️",
  },
  CrewAI: {
    docsUrl: "https://docs.crewai.com/",
    context7Url: "https://context7.com/crewaiinc/crewai",
    color: "#FF6B35",
    icon: "🤖",
  },
  "OpenAI SDK": {
    docsUrl: "https://platform.openai.com/docs/",
    context7Url: "https://context7.com/openai/openai-python",
    color: "#10A37F",
    icon: "🧠",
  },
  "Claude SDK": {
    docsUrl: "https://docs.anthropic.com/",
    context7Url: "https://context7.com/anthropics/anthropic-sdk-python",
    color: "#D97706",
    icon: "📘",
  },
  LangChain: {
    docsUrl: "https://python.langchain.com/docs/",
    context7Url: "https://context7.com/langchain-ai/langchain",
    color: "#2D6A4F",
    icon: "⛓️",
  },
  LangGraph: {
    docsUrl: "https://langchain-ai.github.io/langgraph/",
    context7Url: "https://context7.com/langchain-ai/langgraph",
    color: "#1B4332",
    icon: "🕸️",
  },
  "Keine KI nötig": {
    docsUrl: "",
    context7Url: "",
    color: "#6B7280",
    icon: "✅",
  },
};

export interface Recommendation {
  framework: string;
  ease_of_use: string;
  summary: string;
  reasoning: string;
  ki_notwendig: boolean;
  alternative_ohne_ki: string | null;
}

function getEaseOfUseBadge(level: string) {
  const colors: Record<string, string> = {
    High: "bg-green-100 text-green-800 border-green-200",
    Medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
    Hard: "bg-red-100 text-red-800 border-red-200",
  };
  return colors[level] || "bg-gray-100 text-gray-800 border-gray-200";
}

interface RecommendationCardProps {
  recommendation: Recommendation;
  onContactExperts: () => void;
  onCopy?: () => Promise<boolean>;
  onExport?: () => void;
}

export function RecommendationCard({
  recommendation,
  onContactExperts,
  onCopy,
  onExport,
}: RecommendationCardProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (!onCopy) return;
    const ok = await onCopy();
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }
  const meta = FRAMEWORK_META[recommendation.framework] || {
    docsUrl: "",
    context7Url: "",
    color: "#005691",
    icon: "📦",
  };

  return (
    <div className="mt-8 space-y-6">
      {/* Main Recommendation Card */}
      <div
        className="rounded-lg border-2 overflow-hidden"
        style={{ borderColor: meta.color + "40" }}
      >
        {/* Header */}
        <div
          className="px-6 py-4 flex items-center gap-3"
          style={{ backgroundColor: meta.color + "10" }}
        >
          <span className="text-3xl">{meta.icon}</span>
          <div className="flex-1">
            <h3 className="text-xl font-bold" style={{ color: meta.color }}>
              {recommendation.framework}
            </h3>
            <p className="text-sm text-gray-600">{recommendation.summary}</p>
          </div>
          <span
            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${getEaseOfUseBadge(recommendation.ease_of_use)}`}
          >
            Ease of Use: {recommendation.ease_of_use}
          </span>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {/* Reasoning */}
          <div className="mb-5">
            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Begründung
            </h4>
            <p className="text-gray-700 leading-relaxed">
              {recommendation.reasoning}
            </p>
          </div>

          {/* No-AI Alternative */}
          {!recommendation.ki_notwendig &&
            recommendation.alternative_ohne_ki && (
              <div className="mb-5 rounded-md border border-green-200 bg-green-50 p-4">
                <h4 className="text-sm font-semibold text-green-800 mb-1">
                  💡 Alternative ohne KI
                </h4>
                <p className="text-green-700 text-sm">
                  {recommendation.alternative_ohne_ki}
                </p>
              </div>
            )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 pt-2">
            {meta.docsUrl && (
              <Button asChild variant="default">
                <a
                  href={meta.docsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Zu den Docs
                </a>
              </Button>
            )}

            {meta.context7Url && (
              <Button asChild variant="outline">
                <a
                  href={meta.context7Url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Bot className="mr-2 h-4 w-4" />
                  Zum Expertenagenten
                </a>
              </Button>
            )}

            <Button variant="secondary" onClick={onContactExperts}>
              <Users className="mr-2 h-4 w-4" />
              Expertenteam kontaktieren
            </Button>

            {/* Export & Copy */}
            <div className="flex gap-2 ml-auto">
              {onCopy && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopy}
                  title="In Zwischenablage kopieren"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              )}
              {onExport && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onExport}
                  title="Als Markdown exportieren"
                >
                  <Download className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import type { Recommendation } from "@/components/recommendation-card";

const STORAGE_KEY = "agent4agents_history";
const MAX_HISTORY = 10;

export interface HistoryEntry {
  id: string;
  timestamp: string;
  formInput: {
    useCaseDescription: string;
    preferredModelEcosystem: string;
    interactionChannel: string;
    integrationTargets: string;
  };
  recommendation: Recommendation;
}

function loadHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveHistory(entries: HistoryEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // localStorage full or unavailable — silently ignore
  }
}

export function useRecommendationHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  const addEntry = useCallback(
    (
      formInput: HistoryEntry["formInput"],
      recommendation: Recommendation,
    ) => {
      const entry: HistoryEntry = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        formInput,
        recommendation,
      };
      setHistory((prev) => {
        const next = [entry, ...prev].slice(0, MAX_HISTORY);
        saveHistory(next);
        return next;
      });
      return entry;
    },
    [],
  );

  const removeEntry = useCallback((id: string) => {
    setHistory((prev) => {
      const next = prev.filter((e) => e.id !== id);
      saveHistory(next);
      return next;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    saveHistory([]);
  }, []);

  return { history, addEntry, removeEntry, clearHistory };
}

// --- Export helpers ---

export function entryToMarkdown(entry: HistoryEntry): string {
  const r = entry.recommendation;
  const date = new Date(entry.timestamp).toLocaleString("de-DE");
  return `# Framework-Empfehlung: ${r.framework}

**Datum:** ${date}
**Ease of Use:** ${r.ease_of_use}
**KI notwendig:** ${r.ki_notwendig ? "Ja" : "Nein"}

## Zusammenfassung

${r.summary}

## Begründung

${r.reasoning}
${
  !r.ki_notwendig && r.alternative_ohne_ki
    ? `
## Alternative ohne KI

${r.alternative_ohne_ki}
`
    : ""
}
## Use Case (Eingabe)

**Beschreibung:** ${entry.formInput.useCaseDescription}

**Bevorzugtes LLM:** ${entry.formInput.preferredModelEcosystem}

**Interaktionskanal:** ${entry.formInput.interactionChannel}

**Integration Targets:** ${entry.formInput.integrationTargets || "–"}
`;
}

export function entryToClipboardText(entry: HistoryEntry): string {
  const r = entry.recommendation;
  return `Framework-Empfehlung: ${r.framework}
Ease of Use: ${r.ease_of_use}
KI notwendig: ${r.ki_notwendig ? "Ja" : "Nein"}

${r.summary}

Begründung: ${r.reasoning}${!r.ki_notwendig && r.alternative_ohne_ki ? `\n\nAlternative ohne KI: ${r.alternative_ohne_ki}` : ""}`;
}

export function downloadMarkdown(entry: HistoryEntry) {
  const md = entryToMarkdown(entry);
  const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `empfehlung-${entry.recommendation.framework.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${new Date(entry.timestamp).toISOString().slice(0, 10)}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function copyToClipboard(entry: HistoryEntry): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(entryToClipboardText(entry));
    return true;
  } catch {
    return false;
  }
}

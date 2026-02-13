"use client";

import { createPortal } from "react-dom";
import { useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { History, Trash2, X, Clock } from "lucide-react";
import type { HistoryEntry } from "@/hooks/use-recommendation-history";

interface HistoryPanelProps {
  history: HistoryEntry[];
  isOpen: boolean;
  onToggle: () => void;
  onSelect: (entry: HistoryEntry) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
}

export function HistoryPanel({
  history,
  isOpen,
  onToggle,
  onSelect,
  onRemove,
  onClear,
}: HistoryPanelProps) {
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const overlay =
    isOpen && isClient
      ? createPortal(
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-100 bg-black/20"
              onClick={onToggle}
            />

            {/* Panel */}
            <div className="fixed right-0 top-0 z-110 flex h-full w-full max-w-md flex-col border-l border-gray-200 bg-white shadow-xl">
              {/* Panel header */}
              <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
                <div className="flex items-center gap-2">
                  <History className="h-5 w-5 text-gray-500" />
                  <h2 className="text-lg font-semibold text-gray-900">
                    Letzte Empfehlungen
                  </h2>
                </div>
                <div className="flex items-center gap-1">
                  {history.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onClear}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      title="Alle löschen"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={onToggle}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Panel body */}
              <div className="flex-1 overflow-y-auto p-4">
                {history.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                    <Clock className="h-10 w-10 mb-3" />
                    <p className="text-sm">
                      Noch keine Empfehlungen vorhanden.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {history.map((entry) => (
                      <div
                        key={entry.id}
                        className="group relative rounded-lg border border-gray-200 p-4 hover:border-[#005691]/40 hover:bg-[#005691]/5 transition-colors cursor-pointer"
                        onClick={() => {
                          onSelect(entry);
                          onToggle();
                        }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 truncate">
                              {entry.recommendation.framework}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {new Date(entry.timestamp).toLocaleString(
                                "de-DE",
                                {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )}
                            </p>
                            <p className="text-sm text-gray-600 mt-1.5 line-clamp-2">
                              {entry.recommendation.summary}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              onRemove(entry.id);
                            }}
                            title="Eintrag löschen"
                          >
                            <X className="h-3.5 w-3.5 text-gray-400" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>,
          document.body,
        )
      : null;

  return (
    <>
      {/* Toggle Button (in header) */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggle}
        className="relative"
        title="Empfehlungs-Historie"
      >
        <History className="h-5 w-5" />
        {isClient && history.length > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#005691] text-[10px] font-bold text-white">
            {history.length}
          </span>
        )}
      </Button>

      {overlay}
    </>
  );
}

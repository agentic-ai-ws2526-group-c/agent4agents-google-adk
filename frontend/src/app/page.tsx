"use client";

import {
  Field,
  FieldDescription,
  FieldLabel,
  FieldError,
} from "@/components/ui/field";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  RotateCcw,
  Check,
  ChevronDown,
  ChevronUp,
  FileText,
  Compass,
  Award,
} from "lucide-react";
import {
  RecommendationCard,
  type Recommendation,
  type JudgeEvaluation,
} from "@/components/recommendation-card";
import { HistoryPanel } from "@/components/history-panel";
import {
  useRecommendationHistory,
  downloadMarkdown,
  copyToClipboard,
  type HistoryEntry,
} from "@/hooks/use-recommendation-history";

/* ─── Schema ─── */

const formSchema = z.object({
  useCaseDescription: z
    .string()
    .min(1, { message: "Dieses Feld ist erforderlich" }),
  preferredModelEcosystem: z
    .string()
    .min(1, { message: "Dieses Feld ist erforderlich" }),
  interactionChannel: z
    .string()
    .min(1, { message: "Dieses Feld ist erforderlich" }),
  integrationTargets: z.string(),
});

type FormValues = z.infer<typeof formSchema>;

/* ─── Step types & constants ─── */

type Step = "form" | "loading" | "result";

const STEPS: { key: Step; label: string }[] = [
  { key: "form", label: "Eingabe" },
  { key: "loading", label: "Analyse" },
  { key: "result", label: "Ergebnis" },
];

const LOADING_STAGES = [
  { label: "Sitzung wird erstellt", icon: "🔗", delay: 0 },
  {
    label: "CompassAgent analysiert deinen Use Case",
    icon: "🧭",
    delay: 2000,
  },
  {
    label: "JudgeAgent bewertet die Empfehlung",
    icon: "⚖️",
    delay: 8000,
  },
];

const MODEL_LABELS: Record<string, string> = {
  openai: "OpenAI GPT",
  google: "Google Gemini",
  anthropic: "Anthropic Claude",
  keine: "Keine Präferenz",
  andere: "Anderes",
};

const CHANNEL_LABELS: Record<string, string> = {
  chatbot: "Chatbot / Konversation",
  background: "Hintergrundprozess / Automatisierung",
  api: "API / Service",
  dashboard: "Dashboard / UI",
  andere: "Anderer Kanal",
};

/* ─── Step Indicator ─── */

function StepIndicator({ currentStep }: { currentStep: Step }) {
  const stepIndex = STEPS.findIndex((s) => s.key === currentStep);
  const icons = [FileText, Compass, Award];

  return (
    <div className="flex items-center gap-1 sm:gap-2">
      {STEPS.map((s, i) => {
        const Icon = icons[i];
        const isCompleted = i < stepIndex;
        const isCurrent = i === stepIndex;
        return (
          <div key={s.key} className="flex items-center gap-1 sm:gap-2">
            {i > 0 && (
              <div
                className={`w-6 sm:w-10 h-px transition-colors duration-300 ${
                  i <= stepIndex ? "bg-[#005691]" : "bg-gray-200"
                }`}
              />
            )}
            <div className="flex items-center gap-1.5">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${
                  isCompleted
                    ? "bg-[#005691] text-white"
                    : isCurrent
                      ? "bg-[#005691] text-white ring-4 ring-[#005691]/20"
                      : "bg-gray-100 text-gray-400"
                }`}
              >
                {isCompleted ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Icon className="h-3.5 w-3.5" />
                )}
              </div>
              <span
                className={`text-xs hidden sm:inline transition-colors duration-300 ${
                  isCurrent
                    ? "text-[#005691] font-semibold"
                    : isCompleted
                      ? "text-[#005691]/60"
                      : "text-gray-400"
                }`}
              >
                {s.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Loading View ─── */

function LoadingView({ stage }: { stage: number }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-10 animate-fade-in">
      {/* Big spinner */}
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-[#005691]/10 animate-ping" />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-[#005691]/5">
          <Loader2 className="h-10 w-10 animate-spin text-[#005691]" />
        </div>
      </div>

      {/* Animated stages */}
      <div className="space-y-3 w-full max-w-sm">
        {LOADING_STAGES.map((s, i) => {
          const isCompleted = i < stage;
          const isCurrent = i === stage;
          const isPending = i > stage;
          return (
            <div
              key={i}
              className={`flex items-center gap-3 px-5 py-3.5 rounded-xl transition-all duration-500 ${
                isCurrent
                  ? "bg-white border-2 border-[#005691]/30 shadow-md shadow-[#005691]/5"
                  : isCompleted
                    ? "bg-gray-50 border border-gray-100"
                    : "border border-transparent"
              } ${isPending ? "opacity-30" : ""}`}
            >
              <span className="text-lg shrink-0">{s.icon}</span>
              <span
                className={`text-sm flex-1 ${
                  isCurrent
                    ? "text-[#005691] font-medium"
                    : isCompleted
                      ? "text-gray-500"
                      : "text-gray-400"
                }`}
              >
                {s.label}
              </span>
              {isCompleted && (
                <Check className="h-4 w-4 text-green-500 shrink-0" />
              )}
              {isCurrent && (
                <Loader2 className="h-4 w-4 animate-spin text-[#005691] shrink-0" />
              )}
            </div>
          );
        })}
      </div>

      <p className="text-xs text-gray-400">
        Dies kann bis zu 30 Sekunden dauern…
      </p>
    </div>
  );
}

/* ─── Input Summary (collapsible, shown in result view) ─── */

function InputSummary({ values }: { values: FormValues | null }) {
  const [open, setOpen] = useState(false);
  if (!values) return null;

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50/50 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full px-5 py-3.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
      >
        <span className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Deine Eingabe
        </span>
        {open ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </button>
      {open && (
        <div className="px-5 pb-4 space-y-2 text-sm text-gray-600 border-t border-gray-200 pt-3 animate-fade-in">
          <div>
            <span className="font-medium text-gray-700">Use Case: </span>
            {values.useCaseDescription}
          </div>
          <div>
            <span className="font-medium text-gray-700">LLM-Präferenz: </span>
            {MODEL_LABELS[values.preferredModelEcosystem] ||
              values.preferredModelEcosystem}
          </div>
          <div>
            <span className="font-medium text-gray-700">
              Interaktionskanal:{" "}
            </span>
            {CHANNEL_LABELS[values.interactionChannel] ||
              values.interactionChannel}
          </div>
          {values.integrationTargets && (
            <div>
              <span className="font-medium text-gray-700">
                Integration Targets:{" "}
              </span>
              {values.integrationTargets}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Main Page Component ─── */

export default function Agent4Agents() {
  const [step, setStep] = useState<Step>("form");
  const [loadingStage, setLoadingStage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(
    null,
  );
  const [judgeEvaluation, setJudgeEvaluation] =
    useState<JudgeEvaluation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [currentEntry, setCurrentEntry] = useState<HistoryEntry | null>(null);
  const [submittedValues, setSubmittedValues] = useState<FormValues | null>(
    null,
  );
  const { history, addEntry, removeEntry, clearHistory } =
    useRecommendationHistory();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      useCaseDescription: "",
      preferredModelEcosystem: "keine",
      interactionChannel: "",
      integrationTargets: "",
    },
  });

  /* Loading stage timer */
  useEffect(() => {
    if (step !== "loading") return;
    setLoadingStage(0);
    const timers = LOADING_STAGES.slice(1).map((s, i) =>
      setTimeout(() => setLoadingStage(i + 1), s.delay),
    );
    return () => timers.forEach(clearTimeout);
  }, [step]);

  async function onSubmit(values: FormValues) {
    setStep("loading");
    setIsLoading(true);
    setSubmittedValues(values);
    setRecommendation(null);
    setJudgeEvaluation(null);
    setError(null);

    const agentInput = {
      use_case_description: values.useCaseDescription,
      preferred_model_ecosystem: values.preferredModelEcosystem,
      interaction_channel: values.interactionChannel,
      integration_targets: values.integrationTargets,
    };

    try {
      // 1. Create a fresh session
      const sessionId = crypto.randomUUID();
      const sessionRes = await fetch(
        `http://localhost:8000/apps/agent4agents/users/user/sessions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_id: sessionId }),
        },
      );
      if (!sessionRes.ok) {
        throw new Error("Session konnte nicht erstellt werden.");
      }

      // 2. Send form data as a single message to the agent
      const response = await fetch("http://localhost:8000/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          app_name: "agent4agents",
          user_id: "user",
          session_id: sessionId,
          newMessage: {
            role: "user",
            parts: [{ text: JSON.stringify(agentInput, null, 2) }],
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Fehler vom Server: ${response.status} ${errorText}`);
      }

      const events = await response.json();
      let recommendationText = "";
      let judgeText = "";

      for (const event of events) {
        if (event.content && event.content.role === "model") {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const textPart = event.content.parts?.find((p: any) => p.text);
          if (textPart) {
            if (event.author === "CompassAgent") {
              recommendationText = textPart.text;
            } else if (event.author === "JudgeAgent") {
              judgeText = textPart.text;
            }
          }
        }
      }

      if (!recommendationText) {
        throw new Error("Keine Antwort vom CompassAgent erhalten.");
      }

      // Parse recommendation JSON
      let recJsonStr = recommendationText.trim();
      if (recJsonStr.startsWith("```")) {
        recJsonStr = recJsonStr
          .replace(/^```(?:json)?\n?/, "")
          .replace(/\n?```$/, "");
      }

      // Parse judge evaluation JSON
      let parsedJudge: JudgeEvaluation | undefined;
      if (judgeText) {
        let judgeJsonStr = judgeText.trim();
        if (judgeJsonStr.startsWith("```")) {
          judgeJsonStr = judgeJsonStr
            .replace(/^```(?:json)?\n?/, "")
            .replace(/\n?```$/, "");
        }
        try {
          parsedJudge = JSON.parse(judgeJsonStr);
        } catch {
          console.warn("Failed to parse Judge evaluation:", judgeJsonStr);
        }
      }

      try {
        const parsed: Recommendation = JSON.parse(recJsonStr);
        setRecommendation(parsed);
        setJudgeEvaluation(parsedJudge ?? null);

        const entry = addEntry(
          {
            useCaseDescription: values.useCaseDescription,
            preferredModelEcosystem: values.preferredModelEcosystem,
            interactionChannel: values.interactionChannel,
            integrationTargets: values.integrationTargets,
          },
          parsed,
          parsedJudge,
        );
        setCurrentEntry(entry);
        setStep("result");
      } catch {
        console.error("Failed to parse recommendation JSON:", recJsonStr);
        throw new Error(
          "Die Antwort des Agenten konnte nicht verarbeitet werden. Bitte versuche es erneut.",
        );
      }
    } catch (err) {
      console.error("Error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Ein unbekannter Fehler ist aufgetreten.",
      );
      setStep("form");
    } finally {
      setIsLoading(false);
    }
  }

  function onNewAnalysis() {
    form.reset();
    form.clearErrors();
    setRecommendation(null);
    setJudgeEvaluation(null);
    setError(null);
    setCurrentEntry(null);
    setSubmittedValues(null);
    setStep("form");
  }

  return (
    <div className="flex min-h-screen flex-col bg-white text-gray-900 font-sans">
      {/* Supergraphic Bar */}
      <div className="w-full h-2 bg-[linear-gradient(90deg,#8F0E2E_0%,#6D2077_16%,#005691_33%,#008ECF_50%,#00A896_66%,#92D050_83%,#FFC000_100%)]" />

      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <h1 className="text-lg font-bold text-gray-900 tracking-tight">
            Agent4Agents
          </h1>

          <StepIndicator currentStep={step} />

          <HistoryPanel
            history={history}
            isOpen={historyOpen}
            onToggle={() => setHistoryOpen((v) => !v)}
            onSelect={(entry) => {
              setRecommendation(entry.recommendation);
              setJudgeEvaluation(entry.judgeEvaluation ?? null);
              setCurrentEntry(entry);
              setSubmittedValues({
                useCaseDescription: entry.formInput.useCaseDescription,
                preferredModelEcosystem:
                  entry.formInput.preferredModelEcosystem,
                interactionChannel: entry.formInput.interactionChannel,
                integrationTargets: entry.formInput.integrationTargets,
              });
              setError(null);
              setStep("result");
            }}
            onRemove={removeEntry}
            onClear={clearHistory}
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          {/* ── STEP 1: FORM ── */}
          {step === "form" && (
            <div className="animate-fade-in-up">
              <div className="mb-8">
                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900">
                  Use Case beschreiben
                </h2>
                <p className="mt-3 text-muted-foreground max-w-2xl">
                  Beschreibe deinen Use Case und wir empfehlen dir das passende
                  Agentic-AI-Framework. Je detaillierter deine Beschreibung,
                  desto besser die Empfehlung.
                </p>
              </div>

              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                {/* Use Case Description */}
                <Controller
                  control={form.control}
                  name="useCaseDescription"
                  render={({ field, fieldState }) => (
                    <Field
                      className="flex flex-col gap-2 space-y-0 items-start"
                      data-invalid={fieldState.invalid}
                    >
                      <FieldLabel>Use Case Beschreibung*</FieldLabel>
                      <Textarea
                        id="useCaseDescription"
                        placeholder="Beschreibe deinen Use Case so detailliert wie möglich…"
                        className="min-h-[180px]"
                        {...field}
                      />
                      <FieldDescription>
                        Beschreibe den gesamten Geschäftsprozess, Datenquellen,
                        beteiligte Systeme und das Geschäftsziel. (Min. 300
                        Zeichen empfohlen)
                      </FieldDescription>
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />

                {/* Two-column row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Preferred Model Ecosystem */}
                  <Controller
                    control={form.control}
                    name="preferredModelEcosystem"
                    render={({ field, fieldState }) => (
                      <Field
                        className="flex flex-col gap-2 space-y-0 items-start"
                        data-invalid={fieldState.invalid}
                      >
                        <FieldLabel>Bevorzugtes LLM</FieldLabel>
                        <Select
                          value={field.value}
                          name={field.name}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Auswählen…" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="openai">OpenAI GPT</SelectItem>
                            <SelectItem value="google">
                              Google Gemini
                            </SelectItem>
                            <SelectItem value="anthropic">
                              Anthropic Claude
                            </SelectItem>
                            <SelectItem value="keine">
                              Keine Präferenz
                            </SelectItem>
                            <SelectItem value="andere">
                              Anderes (in Integration Targets angeben)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FieldDescription>
                          Falls du ein bestimmtes LLM nutzen möchtest.
                        </FieldDescription>
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />

                  {/* Interaction Channel */}
                  <Controller
                    control={form.control}
                    name="interactionChannel"
                    render={({ field, fieldState }) => (
                      <Field
                        className="flex flex-col gap-2 space-y-0 items-start"
                        data-invalid={fieldState.invalid}
                      >
                        <FieldLabel>Interaktionskanal*</FieldLabel>
                        <Select
                          value={field.value}
                          name={field.name}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Auswählen…" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="chatbot">
                              Chatbot / Konversation
                            </SelectItem>
                            <SelectItem value="background">
                              Hintergrundprozess / Automatisierung
                            </SelectItem>
                            <SelectItem value="api">API / Service</SelectItem>
                            <SelectItem value="dashboard">
                              Dashboard / UI
                            </SelectItem>
                            <SelectItem value="andere">
                              Anderer Kanal
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FieldDescription>
                          Wie soll der Endnutzer mit der Lösung interagieren?
                        </FieldDescription>
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                </div>

                {/* Integration Targets */}
                <Controller
                  control={form.control}
                  name="integrationTargets"
                  render={({ field, fieldState }) => (
                    <Field
                      className="flex flex-col gap-2 space-y-0 items-start"
                      data-invalid={fieldState.invalid}
                    >
                      <FieldLabel>Integration Targets</FieldLabel>
                      <Textarea
                        id="integrationTargets"
                        placeholder="z.B. SAP, Salesforce, interne REST-APIs, Datenbanken…"
                        className="min-h-[80px]"
                        {...field}
                      />
                      <FieldDescription>
                        Welche externen Systeme, APIs oder Datenquellen sollen
                        angebunden werden? (Optional)
                      </FieldDescription>
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />

                {/* Error Display (appears in form view after failed submit) */}
                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-5 animate-fade-in">
                    <h3 className="text-base font-semibold text-red-800 mb-1">
                      Fehler
                    </h3>
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-3 justify-end pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isLoading}
                    onClick={() => {
                      form.reset();
                      form.clearErrors();
                      setError(null);
                    }}
                  >
                    Zurücksetzen
                  </Button>
                  <Button type="submit" disabled={isLoading} size="lg">
                    {isLoading && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Empfehlung anfordern
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* ── STEP 2: LOADING ── */}
          {step === "loading" && <LoadingView stage={loadingStage} />}

          {/* ── STEP 3: RESULT ── */}
          {step === "result" && recommendation && (
            <div className="animate-fade-in-up">
              {/* Result header */}
              <div className="mb-2 text-center">
                <p className="text-sm font-medium text-[#005691] uppercase tracking-widest mb-2">
                  Analyse abgeschlossen
                </p>
                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900">
                  Deine Empfehlung
                </h2>
              </div>

              {/* Recommendation Card */}
              <RecommendationCard
                recommendation={recommendation}
                judgeEvaluation={judgeEvaluation ?? undefined}
                entry={currentEntry ?? undefined}
                onCopy={
                  currentEntry ? () => copyToClipboard(currentEntry) : undefined
                }
                onExport={
                  currentEntry
                    ? () => downloadMarkdown(currentEntry)
                    : undefined
                }
              />

              {/* Input summary */}
              <div className="mt-6">
                <InputSummary values={submittedValues} />
              </div>

              {/* New analysis CTA */}
              <div className="mt-8 flex justify-center">
                <Button
                  onClick={onNewAnalysis}
                  size="lg"
                  variant="outline"
                  className="gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Neue Analyse starten
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white p-4">
        <p className="text-center text-xs text-gray-400">
          KI-generierte Inhalte. Bitte wichtige Informationen verifizieren.
        </p>
      </footer>
    </div>
  );
}

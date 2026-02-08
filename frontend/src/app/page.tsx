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
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import {
  RecommendationCard,
  type Recommendation,
} from "@/components/recommendation-card";

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

export default function Agent4Agents() {
  const [isLoading, setIsLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      useCaseDescription: "",
      preferredModelEcosystem: "keine",
      interactionChannel: "",
      integrationTargets: "",
    },
  });

  async function onSubmit(values: FormValues) {
    setIsLoading(true);
    setRecommendation(null);
    setError(null);

    // Build the structured JSON input for the agent
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
      let assistantMessage = "";

      // Find the latest model response
      for (let i = events.length - 1; i >= 0; i--) {
        const event = events[i];
        if (event.content && event.content.role === "model") {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const textPart = event.content.parts?.find((p: any) => p.text);
          if (textPart) {
            assistantMessage = textPart.text;
            break;
          }
        }
      }

      if (!assistantMessage) {
        throw new Error("Keine Antwort vom Agenten erhalten.");
      }

      // Parse JSON from agent response
      // With output_schema the response is guaranteed valid JSON,
      // but we still strip markdown fences as a safety net
      let jsonStr = assistantMessage.trim();
      if (jsonStr.startsWith("```")) {
        jsonStr = jsonStr
          .replace(/^```(?:json)?\n?/, "")
          .replace(/\n?```$/, "");
      }
      try {
        const parsed: Recommendation = JSON.parse(jsonStr);
        setRecommendation(parsed);
      } catch {
        console.error("Failed to parse JSON:", jsonStr);
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
    } finally {
      setIsLoading(false);
    }
  }

  function onReset() {
    form.reset();
    form.clearErrors();
    setRecommendation(null);
    setError(null);
  }

  return (
    <div className="flex min-h-screen flex-col bg-white text-gray-900 font-sans">
      {/* Supergraphic Bar */}
      <div className="w-full h-2 bg-[linear-gradient(90deg,#8F0E2E_0%,#6D2077_16%,#005691_33%,#008ECF_50%,#00A896_66%,#92D050_83%,#FFC000_100%)]"></div>

      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-20 max-w-4xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">
            Agent4Agents
          </h1>
        </div>
      </header>

      <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            onReset={onReset}
            className="space-y-8 @container"
          >
            <div className="grid grid-cols-12 gap-4">
              {/* Title */}
              <div className="col-span-12">
                <h2 className="scroll-m-20 text-4xl font-extrabold tracking-tight @5xl:text-5xl">
                  Agent4Agents
                </h2>
              </div>

              {/* Description */}
              <div className="col-span-12">
                <p className="not-first:mt-6 text-muted-foreground">
                  Dieses Formular dient dazu, deinen Use Case strukturiert zu
                  erfassen und durch die Auswahl der passenden technischen
                  Frameworks die effizienteste Lösung für deine
                  Agentic-AI-Anwendung zu identifizieren.
                </p>
              </div>

              {/* Use Case Description */}
              <Controller
                control={form.control}
                name="useCaseDescription"
                render={({ field, fieldState }) => (
                  <Field
                    className="col-span-12 flex flex-col gap-2 space-y-0 items-start"
                    data-invalid={fieldState.invalid}
                  >
                    <FieldLabel>Use Case Beschreibung*</FieldLabel>
                    <Textarea
                      id="useCaseDescription"
                      placeholder="Beschreibe deinen Use Case..."
                      className="min-h-[160px]"
                      {...field}
                    />
                    <FieldDescription>
                      Bitte beschreibe hier deinen Use Case so detailliert wie
                      möglich. Beschreibe den gesamten zu automatisierenden
                      Geschäftsprozess präzise. Erkläre wo welche Daten
                      vorliegen und gebraucht werden. Benenne alle technischen
                      Systeme die im Prozess zum Einsatz kommen eindeutig.
                      Erkläre das Geschäftsziel. (Min 300 Zeichen)
                    </FieldDescription>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              {/* Preferred Model Ecosystem */}
              <Controller
                control={form.control}
                name="preferredModelEcosystem"
                render={({ field, fieldState }) => (
                  <Field
                    className="col-span-12 @5xl:col-span-6 flex flex-col gap-2 space-y-0 items-start"
                    data-invalid={fieldState.invalid}
                  >
                    <FieldLabel>
                      Welches Large Language Model möchtest du benutzen?
                    </FieldLabel>
                    <Select
                      value={field.value}
                      name={field.name}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Auswählen..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="openai">OpenAI GPT</SelectItem>
                        <SelectItem value="google">Google Gemini</SelectItem>
                        <SelectItem value="anthropic">
                          Anthropic Claude
                        </SelectItem>
                        <SelectItem value="keine">Keine Präferenz</SelectItem>
                        <SelectItem value="andere">
                          Ein anderes (bitte in Integration Targets angeben)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FieldDescription>
                      Falls du ein bestimmtes Large Language Model nutzen
                      möchtest, wähle es bitte hier aus.
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
                    className="col-span-12 @5xl:col-span-6 flex flex-col gap-2 space-y-0 items-start"
                    data-invalid={fieldState.invalid}
                  >
                    <FieldLabel>Interaktionskanal*</FieldLabel>
                    <Select
                      value={field.value}
                      name={field.name}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Auswählen..." />
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
                        <SelectItem value="andere">Anderer Kanal</SelectItem>
                      </SelectContent>
                    </Select>
                    <FieldDescription>
                      Wie soll der Endnutzer mit der KI-Lösung interagieren?
                    </FieldDescription>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              {/* Integration Targets */}
              <Controller
                control={form.control}
                name="integrationTargets"
                render={({ field, fieldState }) => (
                  <Field
                    className="col-span-12 flex flex-col gap-2 space-y-0 items-start"
                    data-invalid={fieldState.invalid}
                  >
                    <FieldLabel>Integration Targets</FieldLabel>
                    <Textarea
                      id="integrationTargets"
                      placeholder="z.B. SAP, Salesforce, interne REST-APIs, Datenbanken..."
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

              {/* Buttons */}
              <div className="col-span-12 flex gap-4 justify-end">
                <Button type="reset" variant="outline" disabled={isLoading}>
                  Zurücksetzen
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Empfehlung anfordern
                </Button>
              </div>
            </div>
          </form>

          {/* Error Display */}
          {error && (
            <div className="mt-8 rounded-md border border-red-200 bg-red-50 p-6">
              <h3 className="text-lg font-semibold text-red-800 mb-2">
                Fehler
              </h3>
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="mt-8 rounded-md border border-gray-200 bg-gray-50 p-8 flex items-center justify-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-[#005691]" />
              <span className="text-gray-600">
                Empfehlung wird generiert...
              </span>
            </div>
          )}

          {/* Recommendation Result */}
          {recommendation && (
            <RecommendationCard
              recommendation={recommendation}
              onContactExperts={() => {
                // TODO: Implement expert contact logic
                alert(
                  "Diese Funktion wird in Kürze verfügbar sein. Bitte kontaktiere das AI-Team direkt.",
                );
              }}
            />
          )}
        </div>
      </main>

      <footer className="border-t border-gray-200 bg-white p-4">
        <p className="text-center text-xs text-gray-400">
          KI-generierte Inhalte. Bitte wichtige Informationen verifizieren.
        </p>
      </footer>
    </div>
  );
}

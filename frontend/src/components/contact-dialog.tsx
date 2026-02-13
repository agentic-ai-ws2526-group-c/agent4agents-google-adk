"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { HistoryEntry } from "@/hooks/use-recommendation-history";

const contactSchema = z.object({
  name: z.string().min(1, "Name ist erforderlich"),
  email: z
    .string()
    .min(1, "E-Mail ist erforderlich")
    .email("Ungültige E-Mail-Adresse"),
  message: z.string().optional(),
});

type ContactFormValues = z.infer<typeof contactSchema>;

interface ContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: HistoryEntry;
}

export function ContactDialog({
  open,
  onOpenChange,
  entry,
}: ContactDialogProps) {
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: "", email: "", message: "" },
  });

  function handleClose(value: boolean) {
    if (status === "loading") return;
    onOpenChange(value);
    // Reset after close animation
    if (!value) {
      setTimeout(() => {
        form.reset();
        setStatus("idle");
        setErrorMessage("");
      }, 200);
    }
  }

  async function onSubmit(values: ContactFormValues) {
    setStatus("loading");
    setErrorMessage("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          email: values.email,
          message: values.message ?? "",
          context: {
            recommendation: entry.recommendation,
            formInput: entry.formInput,
            timestamp: entry.timestamp,
          },
        }),
      });

      if (!res.ok) {
        const body = await res.text();
        throw new Error(body || `Fehler ${res.status}`);
      }

      setStatus("success");
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Ein unbekannter Fehler ist aufgetreten.",
      );
      setStatus("error");
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Expertenteam kontaktieren</DialogTitle>
          <DialogDescription>
            Deine Empfehlung für{" "}
            <strong>{entry.recommendation.framework}</strong> wird automatisch
            als Kontext mitgesendet.
          </DialogDescription>
        </DialogHeader>

        {/* ---- Success State ---- */}
        {status === "success" && (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-600" />
            <p className="text-lg font-semibold text-gray-900">
              Nachricht gesendet!
            </p>
            <p className="text-sm text-gray-500">
              Unser Expertenteam wird sich in Kürze bei dir melden.
            </p>
            <Button className="mt-2" onClick={() => handleClose(false)}>
              Schließen
            </Button>
          </div>
        )}

        {/* ---- Form State (idle / loading / error) ---- */}
        {status !== "success" && (
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 w-full min-w-0"
          >
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="contact-name">Name *</Label>
              <Input
                id="contact-name"
                placeholder="Max Mustermann"
                {...form.register("name")}
                aria-invalid={!!form.formState.errors.name}
                disabled={status === "loading"}
              />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="contact-email">E-Mail *</Label>
              <Input
                id="contact-email"
                type="email"
                placeholder="max@beispiel.de"
                {...form.register("email")}
                aria-invalid={!!form.formState.errors.email}
                disabled={status === "loading"}
              />
              {form.formState.errors.email && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label htmlFor="contact-message">Nachricht / Anliegen</Label>
              <Textarea
                id="contact-message"
                placeholder="Beschreibe dein Anliegen (optional)..."
                className="min-h-[100px]"
                {...form.register("message")}
                disabled={status === "loading"}
              />
            </div>

            {/* Context Summary */}
            <div className="rounded-md border border-gray-200 bg-gray-50 p-3 text-xs text-gray-500 space-y-1">
              <p className="font-medium text-gray-700">Wird mitgesendet:</p>
              <p>Framework: {entry.recommendation.framework}</p>
              <p className="truncate">
                Use Case: {entry.formInput.useCaseDescription}
              </p>
              <p>LLM: {entry.formInput.preferredModelEcosystem}</p>
              <p>Kanal: {entry.formInput.interactionChannel}</p>
            </div>

            {/* Error Feedback */}
            {status === "error" && (
              <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <XCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <p>{errorMessage}</p>
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleClose(false)}
                disabled={status === "loading"}
              >
                Abbrechen
              </Button>
              <Button type="submit" disabled={status === "loading"}>
                {status === "loading" && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Absenden
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

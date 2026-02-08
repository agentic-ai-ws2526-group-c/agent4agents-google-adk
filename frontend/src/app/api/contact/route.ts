import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import fs from "node:fs/promises";
import path from "node:path";

const contactPayloadSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  message: z.string().optional().default(""),
  context: z.object({
    recommendation: z.object({
      framework: z.string(),
      ease_of_use: z.string(),
      summary: z.string(),
      reasoning: z.string(),
      ki_notwendig: z.boolean(),
      alternative_ohne_ki: z.string().nullable(),
    }),
    formInput: z.object({
      useCaseDescription: z.string(),
      preferredModelEcosystem: z.string(),
      interactionChannel: z.string(),
      integrationTargets: z.string(),
    }),
    timestamp: z.string(),
  }),
});

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "contacts.json");

interface ContactRecord {
  id: string;
  receivedAt: string;
  name: string;
  email: string;
  message: string;
  context: z.infer<typeof contactPayloadSchema>["context"];
}

async function readContacts(): Promise<ContactRecord[]> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function writeContacts(records: ContactRecord[]) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(records, null, 2), "utf-8");
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = contactPayloadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Ungültige Eingabe", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { name, email, message, context } = parsed.data;

    const record: ContactRecord = {
      id: crypto.randomUUID(),
      receivedAt: new Date().toISOString(),
      name,
      email,
      message,
      context,
    };

    const contacts = await readContacts();
    contacts.push(record);
    await writeContacts(contacts);

    return NextResponse.json({ success: true, id: record.id }, { status: 201 });
  } catch (err) {
    console.error("Contact API error:", err);
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 },
    );
  }
}

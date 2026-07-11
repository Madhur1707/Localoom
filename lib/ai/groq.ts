import { createGroq } from "@ai-sdk/groq";

// Groq's fastest capable general model; overridable per deployment. Kept server-
// side only — the API key must never reach the browser.
const DEFAULT_MODEL = "llama-3.3-70b-versatile";

// A missing key is a setup mistake, not a runtime surprise: fail loudly with a
// message that says exactly what to do, so it surfaces as a clear 500 rather than
// an opaque provider error mid-stream.
function requireApiKey(): string {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GROQ_API_KEY is not set. Add it to your .env to enable the AI assistant."
    );
  }
  return apiKey;
}

export function getAssistantModel() {
  const groq = createGroq({ apiKey: requireApiKey() });
  return groq(process.env.GROQ_MODEL ?? DEFAULT_MODEL);
}

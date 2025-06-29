// app/api/nl-query/route.ts
import { google } from "@ai-sdk/google";
import { CoreMessage, streamText } from "ai";
import { NextRequest } from "next/server";

const gemini = google("gemini-1.5-flash");

export async function POST(req: NextRequest) {
  const {
    messages,
    rows,
  }: { messages: CoreMessage[]; rows: any[]; query: string } = await req.json();

  const systemPrompt = `You are a data filtering assistant. The user will ask questions about a dataset. You must return a filtered result in JSON format from the provided data.

Examples:

Prompt: Show all tasks longer than 2 phases
Data: [{ TaskID: "T1", Duration: 3 }, { TaskID: "T2", Duration: 1 }]
Response: [{ TaskID: "T1", Duration: 3 }]

Prompt: Show clients with priority 1
Data: [{ ClientID: "C1", PriorityLevel: 1 }, { ClientID: "C2", PriorityLevel: 3 }]
Response: [{ ClientID: "C1", PriorityLevel: 1 }]

Now respond to this prompt:
Data: ${JSON.stringify(rows).slice(0, 8000)} // truncate for token limit
`;

  const response = streamText({
    model: gemini,
    system: "Chat with me like Ronaldo",
    messages,
  });
  console.log({ response: response.text });
  return response.toDataStreamResponse();
}

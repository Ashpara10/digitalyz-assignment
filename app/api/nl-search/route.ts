import { google } from "@ai-sdk/google";
import { streamText } from "ai";
import { NextRequest } from "next/server";

const gemini = google("gemini-1.5-flash");

export async function POST(req: NextRequest) {
  const { query, data, entityType } = await req.json();

  const systemPrompt = `You are a data filtering assistant. The user will ask questions about a dataset in natural language. You must return a filtered result in JSON format from the provided data.

Available entity types: clients, workers, tasks

Examples:

Query: "Show all tasks longer than 2 phases"
Entity: tasks
Data: [{ TaskID: "T1", Duration: 3 }, { TaskID: "T2", Duration: 1 }]
Response: [{ TaskID: "T1", Duration: 3 }]

Query: "Show clients with priority 1"
Entity: clients
Data: [{ ClientID: "C1", PriorityLevel: 1 }, { ClientID: "C2", PriorityLevel: 3 }]
Response: [{ ClientID: "C1", PriorityLevel: 1 }]

Query: "Find workers with javascript skills"
Entity: workers
Data: [{ WorkerID: "W1", Skills: "javascript,react" }, { WorkerID: "W2", Skills: "python" }]
Response: [{ WorkerID: "W1", Skills: "javascript,react" }]

Query: "Show tasks that require machine learning skills"
Entity: tasks
Data: [{ TaskID: "T1", RequiredSkills: "machine_learning,python" }, { TaskID: "T2", RequiredSkills: "javascript" }]
Response: [{ TaskID: "T1", RequiredSkills: "machine_learning,python" }]

Query: "Find enterprise clients with high priority"
Entity: clients
Data: [{ ClientID: "C1", PriorityLevel: 5, GroupTag: "enterprise" }, { ClientID: "C2", PriorityLevel: 2, GroupTag: "startup" }]
Response: [{ ClientID: "C1", PriorityLevel: 5, GroupTag: "enterprise" }]

Now respond to this query:
Query: ${query}
Entity: ${entityType}
Data: ${JSON.stringify(data).slice(0, 8000)} // truncate for token limit

Return ONLY the JSON array of matching records, nothing else.`;

  const response = streamText({
    model: gemini,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: `Query: ${query}\nEntity: ${entityType}\nData: ${JSON.stringify(
          data
        ).slice(0, 8000)}`,
      },
    ],
  });

  return response.toDataStreamResponse();
}

import { google } from "@ai-sdk/google";
import { streamText } from "ai";
import { NextRequest } from "next/server";

const gemini = google("gemini-1.5-flash");

export async function POST(req: NextRequest) {
  const { clients, workers, tasks } = await req.json();

  const systemPrompt = `You are a business rule recommendation system. Analyze the provided data and suggest relevant business rules based on patterns you identify.

Available rule types:
1. co-run: Tasks that must execute together
2. load-limit: Maximum workload constraints for workers
3. phase-window: Time-based phase dependencies
4. skill-match: Required skill alignments
5. priority-boost: Dynamic priority adjustments

Analyze the data for patterns like:
- Tasks that frequently appear together in client requests
- Workers who are consistently overloaded
- Skills that are in high demand but low supply
- Phase conflicts or dependencies
- Priority patterns that could be optimized

Return your response as a JSON array of rule suggestions with this structure:
[
  {
    "type": "rule_type",
    "title": "Human readable title",
    "description": "Detailed explanation of the rule",
    "reasoning": "Why this rule is recommended",
    "confidence": 85,
    "affectedEntities": ["entity_ids"],
    "config": {
      // Rule-specific configuration
    }
  }
]

Data to analyze:
Clients: ${JSON.stringify(clients).slice(0, 4000)}
Workers: ${JSON.stringify(workers).slice(0, 4000)}
Tasks: ${JSON.stringify(tasks).slice(0, 4000)}

Focus on practical, actionable rules that would improve resource allocation efficiency.`;

  const response = streamText({
    model: gemini,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: `Analyze this data and suggest business rules:\nClients: ${JSON.stringify(
          clients
        ).slice(0, 4000)}\nWorkers: ${JSON.stringify(workers).slice(
          0,
          4000
        )}\nTasks: ${JSON.stringify(tasks).slice(0, 4000)}`,
      },
    ],
  });

  return response.toDataStreamResponse();
}

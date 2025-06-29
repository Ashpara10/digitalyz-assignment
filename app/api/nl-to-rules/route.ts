import { google } from "@ai-sdk/google";
import { streamText } from "ai";
import { NextRequest } from "next/server";

const gemini = google("gemini-1.5-flash");

export async function POST(req: NextRequest) {
  const { naturalLanguageRule, clients, workers, tasks } = await req.json();

  const systemPrompt = `You are a natural language to business rule converter. Convert user descriptions into structured business rules.

Available rule types:
1. co-run: Tasks that must execute together
2. load-limit: Maximum workload constraints for workers
3. phase-window: Time-based phase dependencies
4. skill-match: Required skill alignments
5. priority-boost: Dynamic priority adjustments

Rule structure:
{
  "type": "rule_type",
  "name": "Human readable name",
  "description": "Detailed description",
  "entities": ["affected_entity_ids"],
  "status": "valid|conflicting|warning",
  "config": {
    // Rule-specific configuration
  }
}

Examples:
Input: "Tasks T1 and T2 must run together"
Output: {
  "type": "co-run",
  "name": "Task Co-execution Rule",
  "description": "T1 and T2 must run together",
  "entities": ["T1", "T2"],
  "status": "valid",
  "config": { "tasks": ["T1", "T2"], "timing": "simultaneous" }
}

Input: "No worker should exceed 40 hours per week"
Output: {
  "type": "load-limit",
  "name": "Worker Load Limit",
  "description": "No worker should exceed 40 hours per week",
  "entities": ["All Workers"],
  "status": "valid",
  "config": { "maxHours": 40, "period": "week" }
}

Input: "Phase 1 tasks must complete before Phase 2 starts"
Output: {
  "type": "phase-window",
  "name": "Phase 1 Priority Window",
  "description": "Phase 1 tasks must complete before Phase 2 starts",
  "entities": ["Phase 1", "Phase 2"],
  "status": "valid",
  "config": { "phases": [1, 2], "dependency": "sequential" }
}

Natural language rule: ${naturalLanguageRule}

Available entities:
Clients: ${JSON.stringify(clients).slice(0, 3000)}
Workers: ${JSON.stringify(workers).slice(0, 3000)}
Tasks: ${JSON.stringify(tasks).slice(0, 3000)}

Return ONLY the JSON rule object, nothing else.`;

  const response = streamText({
    model: gemini,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: `Convert this to a business rule: ${naturalLanguageRule}\n\nAvailable entities:\nClients: ${JSON.stringify(
          clients
        ).slice(0, 3000)}\nWorkers: ${JSON.stringify(workers).slice(
          0,
          3000
        )}\nTasks: ${JSON.stringify(tasks).slice(0, 3000)}`,
      },
    ],
  });

  return response.toDataStreamResponse();
}

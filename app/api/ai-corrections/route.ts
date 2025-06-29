import { google } from "@ai-sdk/google";
import { streamText } from "ai";
import { NextRequest } from "next/server";

const gemini = google("gemini-1.5-flash");

export async function POST(req: NextRequest) {
  const { errors, data, entityType } = await req.json();

  const systemPrompt = `You are a data correction assistant. Given validation errors and the data, suggest specific fixes for each error.

Available entity types: clients, workers, tasks

For each error, provide:
1. A clear description of what needs to be fixed
2. The specific correction to apply
3. A confidence score (0-100)
4. Whether the fix can be applied automatically

Return your response as a JSON array of correction suggestions:
[
  {
    "errorIndex": 0,
    "title": "Fix description",
    "description": "Detailed explanation",
    "correction": {
      "row": 2,
      "field": "PriorityLevel",
      "oldValue": "6",
      "newValue": "5",
      "reason": "PriorityLevel must be between 1-5"
    },
    "confidence": 95,
    "autoApply": true
  }
]

Common fixes:
- PriorityLevel: Ensure it's between 1-5
- Duration: Ensure it's at least 1
- AvailableSlots: Ensure it's a valid JSON array of numbers
- Skills: Ensure comma-separated format
- JSON fields: Ensure valid JSON format
- Missing required fields: Suggest default values

Errors to fix: ${JSON.stringify(errors)}
Entity type: ${entityType}
Data: ${JSON.stringify(data).slice(0, 6000)}

Focus on practical, safe corrections that maintain data integrity.`;

  const response = streamText({
    model: gemini,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: `Fix these validation errors:\nErrors: ${JSON.stringify(
          errors
        )}\nEntity: ${entityType}\nData: ${JSON.stringify(data).slice(
          0,
          6000
        )}`,
      },
    ],
  });

  return response.toDataStreamResponse();
}

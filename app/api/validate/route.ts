import { type NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

export async function POST(request: NextRequest) {
  try {
    const { data, entityType } = await request.json()
console.log({data})
    if (!data || !entityType) {
      return NextResponse.json({ error: "Missing data or entityType" }, { status: 400 })
    }

    // Create validation prompt based on entity type
    const validationPrompt = createValidationPrompt(data, entityType)

    const result = await model.generateContent(validationPrompt)
    const response = await result.response
    const text = response.text()

    try {
      const validationResult = JSON.parse(text)
      return NextResponse.json(validationResult)
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError)
      return NextResponse.json({ error: "Failed to parse AI validation response" }, { status: 500 })
    }
  } catch (error) {
    console.error("Validation API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

function createValidationPrompt(data: any[], entityType: string): string {
  const sampleData = JSON.stringify(data.slice(0, 5), null, 2)

  const entityRules = {
    clients: {
      required: ["id", "name", "contact"],
      formats: {
        contact: "valid email format",
        budget: "numeric value",
        priority: "High, Medium, or Low",
      },
    },
    workers: {
      required: ["id", "name", "skills"],
      formats: {
        availability: 'hours per week (e.g., "40h/week")',
        rate: "numeric hourly rate",
        skills: "comma-separated list",
      },
    },
    tasks: {
      required: ["id", "title", "duration"],
      formats: {
        duration: 'time format (e.g., "2 weeks", "5 days")',
        phase: "numeric phase number",
        priority: "High, Medium, or Low",
      },
    },
  }

  const rules = entityRules[entityType as keyof typeof entityRules]

  return `
You are a data validation expert. Analyze this ${entityType} data for a resource allocation system.

Sample Data:
${sampleData}

Validation Rules for ${entityType}:
- Required fields: ${rules.required.join(", ")}
- Format requirements: ${JSON.stringify(rules.formats, null, 2)}

Please validate each record and return a JSON response with this structure:
{
  "isValid": boolean,
  "errors": [
    {
      "row": number,
      "column": "field_name",
      "message": "error description",
      "type": "missing|format|duplicate|invalid",
      "severity": "high|medium|low",
      "suggestion": "how to fix this error"
    }
  ],
  "suggestions": [
    {
      "title": "Fix suggestion title",
      "description": "What this fix does",
      "action": "Specific action to take",
      "affectedRows": [row_numbers],
      "confidence": confidence_score_0_to_100
    }
  ],
  "summary": {
    "totalRecords": number,
    "validRecords": number,
    "errorCount": number,
    "warningCount": number
  }
}

Focus on practical, actionable validation that helps users clean their data effectively.
`
}

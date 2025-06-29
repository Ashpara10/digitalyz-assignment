import { type NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

export async function POST(request: NextRequest) {
  try {
    const { error, entityType, rowData, columnName } = await request.json()

    const fixPrompt = `
You are helping to fix a data validation error in a ${entityType} spreadsheet for resource allocation.

Error Details:
- Error: ${error}
- Entity Type: ${entityType}
- Column: ${columnName}
- Current Data: ${JSON.stringify(rowData, null, 2)}

Please provide a specific fix for this data. Return JSON with this structure:
{
  "fixedValue": "the corrected value",
  "explanation": "why this fix is appropriate",
  "confidence": confidence_score_0_to_100,
  "alternativeOptions": ["option1", "option2"] // if applicable
}

Rules for different entity types:
- Clients: contact must be valid email, budget must be numeric, priority must be High/Medium/Low
- Workers: availability should be in "Xh/week" format, rate must be numeric, skills comma-separated
- Tasks: duration should be in "X weeks/days" format, phase must be numeric, priority High/Medium/Low

Provide the most logical fix based on the context and common data patterns.
`

    const result = await model.generateContent(fixPrompt)
    const response = await result.response
    const text = response.text()

    try {
      const fixResult = JSON.parse(text)
      return NextResponse.json(fixResult)
    } catch (parseError) {
      return NextResponse.json({
        fixedValue: null,
        explanation: "Could not generate automatic fix",
        confidence: 0,
        alternativeOptions: [],
      })
    }
  } catch (error) {
    console.error("AI Fix API error:", error)
    return NextResponse.json({ error: "Failed to generate fix" }, { status: 500 })
  }
}

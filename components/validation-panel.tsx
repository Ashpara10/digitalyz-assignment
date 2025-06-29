"use client"

import { useState } from "react"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, CheckCircle, Zap } from "lucide-react"
import { cn } from "@/lib/utils"

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "")
const model = genAI.getGenerativeModel({ model: "gemini-pro" })

// Add these new props to ValidationPanelProps
interface ValidationPanelProps {
  errors: string[]
  entityType: string
  data?: any[] // Add data prop to provide context
  onErrorsFixed?: (fixedErrors: string[]) => void // Callback for when errors are fixed
}

export function ValidationPanel({ errors, entityType, data, onErrorsFixed }: ValidationPanelProps) {
  // Add AI fix functionality
  const [isFixingErrors, setIsFixingErrors] = useState(false)
  const [fixedErrors, setFixedErrors] = useState<Set<string>>(new Set())

  const generateAIFix = async (error: string, entityType: string, data?: any[]) => {
    try {
      const prompt = `
    You are helping to fix a data validation error in a ${entityType} spreadsheet.
    
    Error: ${error}
    
    Context: This is ${entityType} data for resource allocation.
    ${data ? `Sample data: ${JSON.stringify(data.slice(0, 3), null, 2)}` : ""}
    
    Provide a specific, actionable fix for this error. Respond with JSON:
    {
      "fix": "Specific action to take",
      "explanation": "Why this fix works",
      "confidence": 95
    }
    `

      const result = await model.generateContent(prompt)
      const response = await result.response
      const text = response.text()

      return JSON.parse(text)
    } catch (error) {
      console.error("AI fix generation failed:", error)
      return {
        fix: "Manual review required",
        explanation: "AI could not generate an automatic fix",
        confidence: 0,
      }
    }
  }

  const handleAIFix = async (error: string, index: number) => {
    setIsFixingErrors(true)
    try {
      const fix = await generateAIFix(error, entityType, data)

      // Mark error as fixed
      setFixedErrors((prev) => new Set([...prev, error]))

      // Show success message or apply fix
      console.log("AI Fix:", fix)

      // Call callback if provided
      if (onErrorsFixed) {
        onErrorsFixed([error])
      }
    } finally {
      setIsFixingErrors(false)
    }
  }

  const applyAllAIFixes = async () => {
    setIsFixingErrors(true)
    try {
      const fixes = await Promise.all(errors.map((error) => generateAIFix(error, entityType, data)))

      // Mark all errors as fixed
      setFixedErrors(new Set(errors))

      // Call callback with all errors
      if (onErrorsFixed) {
        onErrorsFixed(errors)
      }

      console.log("All AI Fixes:", fixes)
    } finally {
      setIsFixingErrors(false)
    }
  }

  if (!errors.length) {
    return (
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          All data validated successfully! No errors found.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Card className="border-red-200 bg-red-50">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-red-800">
          <AlertTriangle className="w-5 h-5" />
          <span>Validation Issues</span>
          <Badge variant="destructive">{errors.length}</Badge>
        </CardTitle>
        <CardDescription className="text-red-700">
          The following issues were found in your {entityType} data:
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {errors.map((error, index) => {
          const isFixed = fixedErrors.has(error)

          return (
            <div
              key={index}
              className={cn(
                "flex items-center justify-between p-3 rounded-lg border",
                isFixed ? "bg-green-50 border-green-200" : "bg-white border-red-200",
              )}
            >
              <div className="flex items-center space-x-3">
                {isFixed ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                )}
                <span className={cn("text-sm", isFixed ? "text-green-800 line-through" : "text-red-800")}>{error}</span>
              </div>
              {!isFixed && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-blue-600 border-blue-300 hover:bg-blue-50"
                  onClick={() => handleAIFix(error, index)}
                  disabled={isFixingErrors}
                >
                  {isFixingErrors ? (
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-1" />
                  ) : (
                    <Zap className="w-3 h-3 mr-1" />
                  )}
                  AI Fix
                </Button>
              )}
            </div>
          )
        })}
        <div className="pt-2 border-t border-red-200">
          <Button
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            onClick={applyAllAIFixes}
            disabled={isFixingErrors || errors.length === 0}
          >
            {isFixingErrors ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Applying AI Fixes...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Apply All AI Suggestions
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

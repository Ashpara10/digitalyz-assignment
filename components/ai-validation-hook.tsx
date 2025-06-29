"use client"

import { useState, useCallback } from "react"

interface ValidationError {
  row: number
  column: string
  message: string
  type: "missing" | "format" | "duplicate" | "invalid"
  severity: "high" | "medium" | "low"
  suggestion: string
}

interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  suggestions: any[]
  summary: {
    totalRecords: number
    validRecords: number
    errorCount: number
    warningCount: number
  }
}

export function useAIValidation() {
  const [isValidating, setIsValidating] = useState(false)
  const [isFixing, setIsFixing] = useState(false)

  const validateData = useCallback(async (data: any[], entityType: string): Promise<ValidationResult> => {
    setIsValidating(true)
    try {
      const response = await fetch("/api/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ data, entityType }),
      })

      if (!response.ok) {
        throw new Error("Validation failed")
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error("Validation error:", error)
      return {
        isValid: false,
        errors: [],
        suggestions: [],
        summary: {
          totalRecords: data.length,
          validRecords: 0,
          errorCount: 0,
          warningCount: 0,
        },
      }
    } finally {
      setIsValidating(false)
    }
  }, [])

  const fixError = useCallback(async (error: string, entityType: string, rowData: any, columnName: string) => {
    setIsFixing(true)
    try {
      const response = await fetch("/api/ai-fix", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ error, entityType, rowData, columnName }),
      })

      if (!response.ok) {
        throw new Error("Fix generation failed")
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error("Fix error:", error)
      return {
        fixedValue: null,
        explanation: "Could not generate automatic fix",
        confidence: 0,
        alternativeOptions: [],
      }
    } finally {
      setIsFixing(false)
    }
  }, [])

  return {
    validateData,
    fixError,
    isValidating,
    isFixing,
  }
}

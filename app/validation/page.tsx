"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Brain, Search, AlertTriangle, CheckCircle, Zap, Filter, ArrowLeft, ArrowRight, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { GoogleGenerativeAI } from "@google/generative-ai"
import React from "react"

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "")
const model = genAI.getGenerativeModel({ model: "gemini-pro" })

interface ValidationIssue {
  id: string
  entity: "clients" | "workers" | "tasks"
  type: "missing" | "format" | "duplicate" | "invalid"
  row: number
  column: string
  message: string
  suggestion: string
  severity: "high" | "medium" | "low"
}

interface AISuggestion {
  id: string
  title: string
  description: string
  affectedRows: number[]
  confidence: number
  action: string
}

export default function ValidationDashboard() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedEntity, setSelectedEntity] = useState<string>("all")
  const [appliedSuggestions, setAppliedSuggestions] = useState<Set<string>>(new Set())
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([])
  const [isLoadingAI, setIsLoadingAI] = useState(false)

  // Mock validation issues
  const validationIssues: ValidationIssue[] = [
    {
      id: "1",
      entity: "clients",
      type: "missing",
      row: 2,
      column: "contact",
      message: "Missing contact email",
      suggestion: "Use company domain to generate email",
      severity: "high",
    },
    {
      id: "2",
      entity: "clients",
      type: "format",
      row: 3,
      column: "budget",
      message: "Invalid budget format",
      suggestion: "Convert to numeric format",
      severity: "medium",
    },
    {
      id: "3",
      entity: "workers",
      type: "format",
      row: 1,
      column: "availability",
      message: "Malformed availability slots",
      suggestion: "Standardize to hours per week format",
      severity: "high",
    },
    {
      id: "4",
      entity: "tasks",
      type: "duplicate",
      row: 5,
      column: "id",
      message: "Duplicate task ID found",
      suggestion: "Generate unique identifier",
      severity: "high",
    },
  ]

  const filteredIssues = validationIssues.filter((issue) => {
    const matchesSearch =
      issue.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.column.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesEntity = selectedEntity === "all" || issue.entity === selectedEntity
    return matchesSearch && matchesEntity
  })

  const groupedIssues = filteredIssues.reduce(
    (acc, issue) => {
      if (!acc[issue.entity]) acc[issue.entity] = []
      acc[issue.entity].push(issue)
      return acc
    },
    {} as Record<string, ValidationIssue[]>,
  )

  const applySuggestion = (suggestionId: string) => {
    setAppliedSuggestions((prev) => new Set([...prev, suggestionId]))
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "low":
        return "bg-blue-100 text-blue-800 border-blue-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const generateAISuggestions = async (issues: ValidationIssue[]) => {
    setIsLoadingAI(true)
    try {
      const prompt = `
      You are an AI assistant helping to clean and validate spreadsheet data for resource allocation.
      
      Here are the validation issues found:
      ${issues
        .map(
          (issue) => `
      - Entity: ${issue.entity}
      - Row: ${issue.row}
      - Column: ${issue.column}
      - Issue: ${issue.message}
      - Type: ${issue.type}
      `,
        )
        .join("\n")}
      
      For each issue, provide:
      1. A clear title for the fix
      2. A description of what needs to be corrected
      3. The specific action to take
      4. A confidence score (0-100)
      
      Format your response as JSON array with this structure:
      [
        {
          "title": "Fix description",
          "description": "Detailed explanation",
          "action": "Specific fix to apply",
          "confidence": 95,
          "affectedRows": [row_numbers]
        }
      ]
      
      Focus on practical, actionable solutions for data cleaning.
      `

      const result = await model.generateContent(prompt)
      const response = await result.response
      const text = response.text()

      try {
        const suggestions = JSON.parse(text)
        return suggestions.map((suggestion: any, index: number) => ({
          id: `ai-${index}`,
          ...suggestion,
        }))
      } catch (parseError) {
        console.error("Failed to parse AI response:", parseError)
        return []
      }
    } catch (error) {
      console.error("Gemini API error:", error)
      return []
    } finally {
      setIsLoadingAI(false)
    }
  }

  // Add useEffect to generate AI suggestions when validation issues change
  React.useEffect(() => {
    if (validationIssues.length > 0) {
      generateAISuggestions(validationIssues).then((suggestions) => {
        setAiSuggestions(suggestions)
      })
    }
  }, [validationIssues])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-violet-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-violet-600 rounded-lg flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Validation Dashboard</h1>
                <p className="text-sm text-gray-600">AI-powered data validation and cleanup</p>
              </div>
            </div>
            <div className="text-sm text-gray-600">Step 2 of 5: Data Validation</div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Search and Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Search className="w-5 h-5" />
                  <span>Natural Language Search</span>
                </CardTitle>
                <CardDescription>Search and filter validation issues using natural language</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Find tasks with duration > 2 and phase 3 preferred"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Filter by entity:</span>
                  <div className="flex space-x-2">
                    {["all", "clients", "workers", "tasks"].map((entity) => (
                      <Button
                        key={entity}
                        size="sm"
                        variant={selectedEntity === entity ? "default" : "outline"}
                        onClick={() => setSelectedEntity(entity)}
                        className="capitalize"
                      >
                        {entity}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Validation Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    <span>Validation Summary</span>
                  </div>
                  <Badge variant="destructive">{filteredIssues.length} issues</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="grouped" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="grouped">Grouped by Entity</TabsTrigger>
                    <TabsTrigger value="severity">By Severity</TabsTrigger>
                  </TabsList>

                  <TabsContent value="grouped" className="space-y-4">
                    {Object.entries(groupedIssues).map(([entity, issues]) => (
                      <div key={entity} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold capitalize text-gray-900">{entity}</h4>
                          <Badge variant="outline">{issues.length} issues</Badge>
                        </div>
                        <div className="space-y-2">
                          {issues.map((issue) => (
                            <div
                              key={issue.id}
                              className="flex items-center justify-between p-3 bg-white rounded-lg border hover:shadow-sm cursor-pointer transition-shadow"
                            >
                              <div className="flex items-center space-x-3">
                                <Badge className={getSeverityColor(issue.severity)}>{issue.severity}</Badge>
                                <div>
                                  <p className="text-sm font-medium text-gray-900">
                                    Row {issue.row}: {issue.message}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    Column: {issue.column} • Type: {issue.type}
                                  </p>
                                </div>
                              </div>
                              <Button size="sm" variant="outline">
                                View Details
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </TabsContent>

                  <TabsContent value="severity" className="space-y-4">
                    {["high", "medium", "low"].map((severity) => {
                      const severityIssues = filteredIssues.filter((issue) => issue.severity === severity)
                      if (severityIssues.length === 0) return null

                      return (
                        <div key={severity} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold capitalize text-gray-900">{severity} Priority</h4>
                            <Badge className={getSeverityColor(severity)}>{severityIssues.length}</Badge>
                          </div>
                          <div className="space-y-2">
                            {severityIssues.map((issue) => (
                              <div
                                key={issue.id}
                                className="flex items-center justify-between p-3 bg-white rounded-lg border"
                              >
                                <div>
                                  <p className="text-sm font-medium text-gray-900">
                                    {issue.entity.charAt(0).toUpperCase() + issue.entity.slice(1)} - Row {issue.row}:{" "}
                                    {issue.message}
                                  </p>
                                  <p className="text-xs text-gray-500">{issue.suggestion}</p>
                                </div>
                                <Button size="sm" variant="outline">
                                  <Zap className="w-3 h-3 mr-1" />
                                  Fix
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* AI Suggestions Sidebar */}
          <div className="space-y-6">
            <Card className="border-violet-200 bg-gradient-to-br from-violet-50 to-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-violet-800">
                  <Sparkles className="w-5 h-5" />
                  <span>AI Suggestions</span>
                </CardTitle>
                <CardDescription className="text-violet-700">
                  Smart recommendations to fix your data issues
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoadingAI ? (
                  <div className="p-4 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600 mx-auto mb-2"></div>
                    <p className="text-sm text-violet-700">AI is analyzing your data...</p>
                  </div>
                ) : (
                  aiSuggestions.map((suggestion) => {
                    const isApplied = appliedSuggestions.has(suggestion.id)

                    return (
                      <div
                        key={suggestion.id}
                        className={cn(
                          "p-4 rounded-lg border transition-all",
                          isApplied ? "bg-green-50 border-green-200" : "bg-white border-gray-200 hover:shadow-sm",
                        )}
                      >
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <h4 className="font-medium text-gray-900 text-sm">{suggestion.title}</h4>
                            <Badge variant="outline" className="text-xs">
                              {suggestion.confidence}% confident
                            </Badge>
                          </div>

                          <p className="text-xs text-gray-600">{suggestion.description}</p>

                          <div className="text-xs text-gray-500">Affects {suggestion.affectedRows.length} row(s)</div>

                          <div className="bg-gray-50 p-2 rounded text-xs font-mono text-gray-700">
                            {suggestion.action}
                          </div>

                          <div className="flex space-x-2">
                            {isApplied ? (
                              <div className="flex items-center space-x-1 text-green-600">
                                <CheckCircle className="w-4 h-4" />
                                <span className="text-xs">Applied</span>
                              </div>
                            ) : (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => applySuggestion(suggestion.id)}
                                  className="bg-violet-600 hover:bg-violet-700 text-white"
                                >
                                  Accept
                                </Button>
                                <Button size="sm" variant="outline">
                                  Ignore
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}

                <div className="pt-4 border-t">
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700">
                    <Zap className="w-4 h-4 mr-2" />
                    Apply All Suggestions
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Validation Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">
                      {validationIssues.filter((i) => i.severity === "high").length}
                    </div>
                    <div className="text-xs text-red-700">High Priority</div>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">
                      {validationIssues.filter((i) => i.severity === "medium").length}
                    </div>
                    <div className="text-xs text-yellow-700">Medium Priority</div>
                  </div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{appliedSuggestions.size}</div>
                  <div className="text-xs text-green-700">Issues Resolved</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center pt-8 border-t">
          <Button variant="outline" className="flex items-center space-x-2">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Upload</span>
          </Button>
          <div className="text-sm text-gray-600">Step 2 of 5: Data Validation</div>
          <Button className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 flex items-center space-x-2">
            <span>Continue to Rules</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </main>
    </div>
  )
}

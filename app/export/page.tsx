"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Download,
  CheckCircle,
  FileSpreadsheet,
  FileCode,
  ArrowLeft,
  Sparkles,
  Users,
  Briefcase,
  ListTodo,
  Settings,
  Brain,
} from "lucide-react"

interface ExportSummary {
  entity: "clients" | "workers" | "tasks"
  name: string
  icon: React.ReactNode
  recordCount: number
  validationStatus: "valid" | "warning" | "error"
  lastModified: string
}

export default function ExportPage() {
  const [exportProgress, setExportProgress] = useState(0)
  const [isExporting, setIsExporting] = useState(false)

  const exportSummary: ExportSummary[] = [
    {
      entity: "clients",
      name: "Clients Data",
      icon: <Users className="w-5 h-5" />,
      recordCount: 15,
      validationStatus: "valid",
      lastModified: "2 minutes ago",
    },
    {
      entity: "workers",
      name: "Workers Data",
      icon: <Briefcase className="w-5 h-5" />,
      recordCount: 23,
      validationStatus: "valid",
      lastModified: "3 minutes ago",
    },
    {
      entity: "tasks",
      name: "Tasks Data",
      icon: <ListTodo className="w-5 h-5" />,
      recordCount: 42,
      validationStatus: "valid",
      lastModified: "1 minute ago",
    },
  ]

  const rulesSummary = {
    totalRules: 8,
    validRules: 7,
    warnings: 1,
    conflicts: 0,
  }

  const prioritizationProfile = {
    name: "Balanced Approach",
    clientPriority: 75,
    fairness: 60,
    fulfillment: 85,
    efficiency: 70,
  }

  const handleExport = async (type: "data" | "rules" | "all") => {
    setIsExporting(true)
    setExportProgress(0)

    // Simulate export progress
    const interval = setInterval(() => {
      setExportProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsExporting(false)
          return 100
        }
        return prev + 10
      })
    }, 200)

    // Mock download after completion
    setTimeout(() => {
      const filename =
        type === "all" ? "resource-allocation-complete.zip" : type === "data" ? "cleaned-data.zip" : "rules-config.json"

      // Create mock download
      const element = document.createElement("a")
      element.href = "#"
      element.download = filename
      element.click()
    }, 2200)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "valid":
        return "bg-green-100 text-green-800 border-green-200"
      case "warning":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "error":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "valid":
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case "warning":
        return <CheckCircle className="w-4 h-4 text-yellow-600" />
      case "error":
        return <CheckCircle className="w-4 h-4 text-red-600" />
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-violet-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-violet-600 rounded-lg flex items-center justify-center">
                <Download className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Export Configuration</h1>
                <p className="text-sm text-gray-600">Download your cleaned data and configuration</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">Step 5 of 5: Export</div>
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle className="w-3 h-3 mr-1" />
                Ready to Export
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Export Summary */}
          <div className="lg:col-span-2 space-y-6">
            {/* Data Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileSpreadsheet className="w-5 h-5" />
                  <span>Data Export Summary</span>
                </CardTitle>
                <CardDescription>Your cleaned and validated data files</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {exportSummary.map((item) => (
                  <div key={item.entity} className="flex items-center justify-between p-4 bg-white border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                        {item.icon}
                      </div>
                      <div>
                        <div className="font-medium">{item.name}</div>
                        <div className="text-sm text-gray-600">
                          {item.recordCount} records • Updated {item.lastModified}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(item.validationStatus)}
                      <Badge className={getStatusColor(item.validationStatus)}>{item.validationStatus}</Badge>
                    </div>
                  </div>
                ))}

                <div className="pt-4 border-t">
                  <Button
                    onClick={() => handleExport("data")}
                    disabled={isExporting}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Cleaned Data Files
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Rules Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="w-5 h-5" />
                  <span>Business Rules Summary</span>
                </CardTitle>
                <CardDescription>Your configured allocation rules and constraints</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{rulesSummary.totalRules}</div>
                    <div className="text-xs text-blue-700">Total Rules</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{rulesSummary.validRules}</div>
                    <div className="text-xs text-green-700">Valid</div>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">{rulesSummary.warnings}</div>
                    <div className="text-xs text-yellow-700">Warnings</div>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{rulesSummary.conflicts}</div>
                    <div className="text-xs text-red-700">Conflicts</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Rule Types Configured:</h4>
                  <div className="flex flex-wrap gap-2">
                    {["Co-run Tasks", "Load Limits", "Phase Windows", "Skill Matching", "Priority Boosts"].map(
                      (rule) => (
                        <Badge key={rule} variant="outline" className="bg-gray-50">
                          {rule}
                        </Badge>
                      ),
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Button
                    onClick={() => handleExport("rules")}
                    disabled={isExporting}
                    className="w-full bg-violet-600 hover:bg-violet-700"
                  >
                    <FileCode className="w-4 h-4 mr-2" />
                    Download Rules Configuration
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Prioritization Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Brain className="w-5 h-5" />
                  <span>Prioritization Profile</span>
                </CardTitle>
                <CardDescription>Your configured priority weights and settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-violet-50 rounded-lg">
                  <div>
                    <div className="font-medium">Active Profile</div>
                    <div className="text-sm text-gray-600">{prioritizationProfile.name}</div>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Optimized
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Client Priority</span>
                      <span className="text-sm font-medium">{prioritizationProfile.clientPriority}%</span>
                    </div>
                    <Progress value={prioritizationProfile.clientPriority} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Fairness</span>
                      <span className="text-sm font-medium">{prioritizationProfile.fairness}%</span>
                    </div>
                    <Progress value={prioritizationProfile.fairness} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Task Fulfillment</span>
                      <span className="text-sm font-medium">{prioritizationProfile.fulfillment}%</span>
                    </div>
                    <Progress value={prioritizationProfile.fulfillment} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Efficiency</span>
                      <span className="text-sm font-medium">{prioritizationProfile.efficiency}%</span>
                    </div>
                    <Progress value={prioritizationProfile.efficiency} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Export Progress */}
            {isExporting && (
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Exporting files...</span>
                      <span className="text-sm text-gray-600">{exportProgress}%</span>
                    </div>
                    <Progress value={exportProgress} className="h-3" />
                    <div className="text-sm text-gray-600">
                      {exportProgress < 30 && "Preparing data files..."}
                      {exportProgress >= 30 && exportProgress < 60 && "Validating configurations..."}
                      {exportProgress >= 60 && exportProgress < 90 && "Generating export package..."}
                      {exportProgress >= 90 && "Finalizing download..."}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Export Options Sidebar */}
          <div className="space-y-6">
            <Card className="border-green-200 bg-gradient-to-br from-green-50 to-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-green-800">
                  <CheckCircle className="w-5 h-5" />
                  <span>Export Ready</span>
                </CardTitle>
                <CardDescription className="text-green-700">
                  All validations passed. Your configuration is ready for export.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Button
                    onClick={() => handleExport("all")}
                    disabled={isExporting}
                    className="w-full bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Complete Package
                  </Button>

                  <div className="text-xs text-gray-600 text-center">
                    Includes all cleaned data files, rules configuration, and priority settings
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Export Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Individual Downloads</h4>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => handleExport("data")}
                      disabled={isExporting}
                    >
                      <FileSpreadsheet className="w-4 h-4 mr-2" />
                      clients.csv
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => handleExport("data")}
                      disabled={isExporting}
                    >
                      <FileSpreadsheet className="w-4 h-4 mr-2" />
                      workers.csv
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => handleExport("data")}
                      disabled={isExporting}
                    >
                      <FileSpreadsheet className="w-4 h-4 mr-2" />
                      tasks.csv
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => handleExport("rules")}
                      disabled={isExporting}
                    >
                      <FileCode className="w-4 h-4 mr-2" />
                      rules.json
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Next Steps</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm space-y-2">
                  <div className="flex items-start space-x-2">
                    <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium text-blue-600 mt-0.5">
                      1
                    </div>
                    <div>
                      <div className="font-medium">Import to your system</div>
                      <div className="text-xs text-gray-600">Use the cleaned CSV files in your allocation system</div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium text-blue-600 mt-0.5">
                      2
                    </div>
                    <div>
                      <div className="font-medium">Apply business rules</div>
                      <div className="text-xs text-gray-600">Implement the rules.json configuration</div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium text-blue-600 mt-0.5">
                      3
                    </div>
                    <div>
                      <div className="font-medium">Monitor and adjust</div>
                      <div className="text-xs text-gray-600">Fine-tune based on real-world results</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center pt-8 border-t">
          <Button variant="outline" className="flex items-center space-x-2">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Priorities</span>
          </Button>
          <div className="text-sm text-gray-600">Configuration Complete</div>
          <Button
            onClick={() => (window.location.href = "/")}
            className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
          >
            Start New Configuration
          </Button>
        </div>
      </main>
    </div>
  )
}

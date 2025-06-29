"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Brain,
  Plus,
  Settings,
  Trash2,
  Edit,
  CheckCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Code,
} from "lucide-react"

interface BusinessRule {
  id: string
  type: "co-run" | "load-limit" | "phase-window" | "skill-match" | "priority-boost"
  name: string
  description: string
  entities: string[]
  status: "valid" | "conflicting" | "warning"
  config: any
}

export default function BusinessRulesPage() {
  const [rules, setRules] = useState<BusinessRule[]>([
    {
      id: "1",
      type: "co-run",
      name: "Task Co-execution Rule",
      description: "T2 and T4 must run together",
      entities: ["T2", "T4"],
      status: "valid",
      config: { tasks: ["T2", "T4"], timing: "simultaneous" },
    },
    {
      id: "2",
      type: "load-limit",
      name: "Worker Load Limit",
      description: "No worker should exceed 40 hours per week",
      entities: ["All Workers"],
      status: "valid",
      config: { maxHours: 40, period: "week" },
    },
    {
      id: "3",
      type: "phase-window",
      name: "Phase 1 Priority Window",
      description: "Phase 1 tasks must complete before Phase 2 starts",
      entities: ["Phase 1", "Phase 2"],
      status: "warning",
      config: { phases: [1, 2], dependency: "sequential" },
    },
  ])

  const [selectedRuleType, setSelectedRuleType] = useState("")
  const [naturalLanguageRule, setNaturalLanguageRule] = useState("")
  const [showRulePreview, setShowRulePreview] = useState(false)
  const [previewRule, setPreviewRule] = useState<any>(null)

  const ruleTypes = [
    { value: "co-run", label: "Co-run Tasks", description: "Tasks that must execute together" },
    { value: "load-limit", label: "Load Limit", description: "Maximum workload constraints" },
    { value: "phase-window", label: "Phase Window", description: "Time-based phase dependencies" },
    { value: "skill-match", label: "Skill Match", description: "Required skill alignments" },
    { value: "priority-boost", label: "Priority Boost", description: "Dynamic priority adjustments" },
  ]

  const processNaturalLanguage = () => {
    // Mock AI processing of natural language rule
    const mockRule = {
      type: "co-run",
      name: "AI Generated Rule",
      description: naturalLanguageRule,
      entities: ["T2", "T4"],
      status: "valid",
      config: { tasks: ["T2", "T4"], timing: "simultaneous" },
    }
    setPreviewRule(mockRule)
    setShowRulePreview(true)
  }

  const addRuleToSet = () => {
    if (previewRule) {
      const newRule: BusinessRule = {
        ...previewRule,
        id: Date.now().toString(),
      }
      setRules([...rules, newRule])
      setNaturalLanguageRule("")
      setShowRulePreview(false)
      setPreviewRule(null)
    }
  }

  const deleteRule = (ruleId: string) => {
    setRules(rules.filter((rule) => rule.id !== ruleId))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "valid":
        return "bg-green-100 text-green-800 border-green-200"
      case "conflicting":
        return "bg-red-100 text-red-800 border-red-200"
      case "warning":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "valid":
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case "conflicting":
        return <AlertTriangle className="w-4 h-4 text-red-600" />
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />
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
                <Settings className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Business Rules Configuration</h1>
                <p className="text-sm text-gray-600">Define and manage allocation rules</p>
              </div>
            </div>
            <div className="text-sm text-gray-600">Step 3 of 5: Rules Configuration</div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Rule Builder */}
          <div className="lg:col-span-2 space-y-6">
            {/* Visual Rule Builder */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="w-5 h-5" />
                  <span>Visual Rule Builder</span>
                </CardTitle>
                <CardDescription>Create business rules using visual components</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="rule-type">Rule Type</Label>
                    <Select value={selectedRuleType} onValueChange={setSelectedRuleType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select rule type" />
                      </SelectTrigger>
                      <SelectContent>
                        {ruleTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <div>
                              <div className="font-medium">{type.label}</div>
                              <div className="text-xs text-gray-500">{type.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="entities">Affected Entities</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select entities" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="clients">Clients</SelectItem>
                        <SelectItem value="workers">Workers</SelectItem>
                        <SelectItem value="tasks">Tasks</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {selectedRuleType && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium mb-3">Rule Configuration</h4>
                    {selectedRuleType === "co-run" && (
                      <div className="space-y-3">
                        <div>
                          <Label>Tasks to Co-run</Label>
                          <div className="flex space-x-2 mt-1">
                            <Input placeholder="Task ID 1" />
                            <Input placeholder="Task ID 2" />
                          </div>
                        </div>
                        <div>
                          <Label>Timing</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Select timing" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="simultaneous">Simultaneous</SelectItem>
                              <SelectItem value="sequential">Sequential</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}
                    {selectedRuleType === "load-limit" && (
                      <div className="space-y-3">
                        <div>
                          <Label>Maximum Hours</Label>
                          <Input type="number" placeholder="40" />
                        </div>
                        <div>
                          <Label>Time Period</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Select period" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="day">Per Day</SelectItem>
                              <SelectItem value="week">Per Week</SelectItem>
                              <SelectItem value="month">Per Month</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-end">
                  <Button disabled={!selectedRuleType} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Rule
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Natural Language Rule Entry */}
            <Card className="border-violet-200 bg-gradient-to-br from-violet-50 to-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-violet-800">
                  <Brain className="w-5 h-5" />
                  <span>Natural Language Rule Entry</span>
                </CardTitle>
                <CardDescription className="text-violet-700">
                  Describe rules in plain English and let AI convert them
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="natural-rule">Describe Your Rule</Label>
                  <Textarea
                    id="natural-rule"
                    placeholder="Make T2 and T4 co-run, ensure no worker exceeds 40 hours per week..."
                    value={naturalLanguageRule}
                    onChange={(e) => setNaturalLanguageRule(e.target.value)}
                    className="min-h-[100px] bg-white"
                  />
                </div>

                <div className="flex space-x-2">
                  <Button
                    onClick={processNaturalLanguage}
                    disabled={!naturalLanguageRule.trim()}
                    className="bg-violet-600 hover:bg-violet-700"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Process with AI
                  </Button>
                  <Button variant="outline">
                    <Code className="w-4 h-4 mr-2" />
                    View JSON
                  </Button>
                </div>

                {showRulePreview && previewRule && (
                  <div className="mt-4 p-4 bg-white rounded-lg border border-violet-200">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-violet-800">AI Generated Rule Preview</h4>
                      <Badge className="bg-violet-100 text-violet-800">95% Confidence</Badge>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div>
                        <strong>Type:</strong> {previewRule.type}
                      </div>
                      <div>
                        <strong>Description:</strong> {previewRule.description}
                      </div>
                      <div>
                        <strong>Entities:</strong> {previewRule.entities.join(", ")}
                      </div>
                    </div>
                    <div className="mt-4 p-3 bg-gray-50 rounded text-xs font-mono">
                      {JSON.stringify(previewRule.config, null, 2)}
                    </div>
                    <div className="flex space-x-2 mt-4">
                      <Button size="sm" onClick={addRuleToSet} className="bg-green-600 hover:bg-green-700">
                        Add to Rule Set
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setShowRulePreview(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Rules Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span>Current Rules</span>
                    <Badge variant="outline">{rules.length} rules</Badge>
                  </div>
                  <Button size="sm" variant="outline">
                    Export Rules
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Rule Type</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Affected Entities</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-20">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rules.map((rule) => (
                        <TableRow key={rule.id}>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {rule.type.replace("-", " ")}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{rule.name}</div>
                              <div className="text-xs text-gray-500">{rule.description}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {rule.entities.map((entity, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {entity}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {getStatusIcon(rule.status)}
                              <Badge className={getStatusColor(rule.status)}>{rule.status}</Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-1">
                              <Button size="sm" variant="ghost">
                                <Edit className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => deleteRule(rule.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Rule Templates Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Rule Templates</CardTitle>
                <CardDescription>Common rule patterns to get you started</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  {
                    name: "Task Dependencies",
                    description: "Sequential task execution",
                    example: "Task A must complete before Task B",
                  },
                  {
                    name: "Resource Limits",
                    description: "Worker capacity constraints",
                    example: "Max 8 hours per day per worker",
                  },
                  {
                    name: "Skill Requirements",
                    description: "Match skills to tasks",
                    example: "React tasks need React developers",
                  },
                  {
                    name: "Client Priorities",
                    description: "Priority-based allocation",
                    example: "High priority clients get first pick",
                  },
                ].map((template, index) => (
                  <div key={index} className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <div className="font-medium text-sm">{template.name}</div>
                    <div className="text-xs text-gray-600 mb-2">{template.description}</div>
                    <div className="text-xs text-blue-600 italic">{template.example}</div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Rule Validation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {rules.filter((r) => r.status === "valid").length}
                    </div>
                    <div className="text-xs text-green-700">Valid Rules</div>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">
                      {rules.filter((r) => r.status === "conflicting").length}
                    </div>
                    <div className="text-xs text-red-700">Conflicts</div>
                  </div>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {rules.filter((r) => r.status === "warning").length}
                  </div>
                  <div className="text-xs text-yellow-700">Warnings</div>
                </div>
                <Button className="w-full" variant="outline">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Validate All Rules
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center pt-8 border-t">
          <Button variant="outline" className="flex items-center space-x-2">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Validation</span>
          </Button>
          <div className="text-sm text-gray-600">Step 3 of 5: Rules Configuration</div>
          <Button className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 flex items-center space-x-2">
            <span>Continue to Priorities</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </main>
    </div>
  )
}

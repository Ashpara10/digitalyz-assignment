"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Brain,
  Sliders,
  Save,
  RotateCcw,
  ArrowLeft,
  ArrowRight,
  GripVertical,
  Target,
  Users,
  Clock,
  Star,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface PriorityWeight {
  id: string
  name: string
  description: string
  value: number
  color: string
  icon: React.ReactNode
}

interface Preset {
  id: string
  name: string
  description: string
  weights: Record<string, number>
}

export default function PrioritizationPage() {
  const [weights, setWeights] = useState<PriorityWeight[]>([
    {
      id: "client-priority",
      name: "Client Priority",
      description: "Weight given to high-priority clients",
      value: 75,
      color: "bg-blue-500",
      icon: <Star className="w-4 h-4" />,
    },
    {
      id: "fairness",
      name: "Fairness",
      description: "Equal distribution among workers",
      value: 60,
      color: "bg-green-500",
      icon: <Users className="w-4 h-4" />,
    },
    {
      id: "fulfillment",
      name: "Task Fulfillment",
      description: "Maximize completed tasks",
      value: 85,
      color: "bg-purple-500",
      icon: <Target className="w-4 h-4" />,
    },
    {
      id: "efficiency",
      name: "Time Efficiency",
      description: "Minimize project duration",
      value: 70,
      color: "bg-orange-500",
      icon: <Clock className="w-4 h-4" />,
    },
  ])

  const [draggedItem, setDraggedItem] = useState<string | null>(null)
  const [selectedPreset, setSelectedPreset] = useState<string>("")

  const presets: Preset[] = [
    {
      id: "maximize-fulfillment",
      name: "Maximize Task Fulfillment",
      description: "Focus on completing as many tasks as possible",
      weights: {
        "client-priority": 60,
        fairness: 40,
        fulfillment: 95,
        efficiency: 70,
      },
    },
    {
      id: "minimize-overload",
      name: "Minimize Worker Overload",
      description: "Prioritize worker well-being and balance",
      weights: {
        "client-priority": 50,
        fairness: 90,
        fulfillment: 60,
        efficiency: 55,
      },
    },
    {
      id: "client-first",
      name: "Client Priority First",
      description: "Prioritize high-value clients above all",
      weights: {
        "client-priority": 95,
        fairness: 30,
        fulfillment: 75,
        efficiency: 80,
      },
    },
    {
      id: "balanced",
      name: "Balanced Approach",
      description: "Equal consideration for all factors",
      weights: {
        "client-priority": 70,
        fairness: 70,
        fulfillment: 70,
        efficiency: 70,
      },
    },
  ]

  const updateWeight = (id: string, value: number) => {
    setWeights(weights.map((w) => (w.id === id ? { ...w, value } : w)))
  }

  const applyPreset = (presetId: string) => {
    const preset = presets.find((p) => p.id === presetId)
    if (preset) {
      setWeights(
        weights.map((w) => ({
          ...w,
          value: preset.weights[w.id] || w.value,
        })),
      )
      setSelectedPreset(presetId)
    }
  }

  const resetWeights = () => {
    setWeights(weights.map((w) => ({ ...w, value: 50 })))
    setSelectedPreset("")
  }

  const saveAsPreset = () => {
    // Mock save functionality
    console.log("Saving current configuration as preset")
  }

  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    setDraggedItem(itemId)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    if (draggedItem && draggedItem !== targetId) {
      const draggedIndex = weights.findIndex((w) => w.id === draggedItem)
      const targetIndex = weights.findIndex((w) => w.id === targetId)

      const newWeights = [...weights]
      const [draggedWeight] = newWeights.splice(draggedIndex, 1)
      newWeights.splice(targetIndex, 0, draggedWeight)

      setWeights(newWeights)
    }
    setDraggedItem(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-violet-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-violet-600 rounded-lg flex items-center justify-center">
                <Sliders className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Prioritization Settings</h1>
                <p className="text-sm text-gray-600">Configure allocation priorities and weights</p>
              </div>
            </div>
            <div className="text-sm text-gray-600">Step 4 of 5: Prioritization</div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Priority Sliders */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Sliders className="w-5 h-5" />
                  <span>Priority Weights</span>
                </CardTitle>
                <CardDescription>Adjust the importance of different allocation factors</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {weights.map((weight) => (
                  <div key={weight.id} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div
                          className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-white", weight.color)}
                        >
                          {weight.icon}
                        </div>
                        <div>
                          <Label className="text-base font-medium">{weight.name}</Label>
                          <p className="text-sm text-gray-600">{weight.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl font-bold text-gray-900 w-12 text-right">{weight.value}</span>
                        <span className="text-sm text-gray-500">%</span>
                      </div>
                    </div>
                    <div className="px-3">
                      <Slider
                        value={[weight.value]}
                        onValueChange={(value) => updateWeight(weight.id, value[0])}
                        max={100}
                        step={5}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Low</span>
                        <span>Medium</span>
                        <span>High</span>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Drag and Drop Ranking */}
            <Card>
              <CardHeader>
                <CardTitle>Priority Ranking</CardTitle>
                <CardDescription>Drag to reorder priorities by importance (most important at top)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {weights.map((weight, index) => (
                    <div
                      key={weight.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, weight.id)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, weight.id)}
                      className={cn(
                        "flex items-center space-x-3 p-4 bg-white border rounded-lg cursor-move hover:shadow-sm transition-shadow",
                        draggedItem === weight.id && "opacity-50",
                      )}
                    >
                      <GripVertical className="w-5 h-5 text-gray-400" />
                      <div className="flex items-center space-x-3 flex-1">
                        <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <div
                          className={cn("w-6 h-6 rounded flex items-center justify-center text-white", weight.color)}
                        >
                          {weight.icon}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{weight.name}</div>
                          <div className="text-sm text-gray-600">{weight.description}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold">{weight.value}%</div>
                          <div className="text-xs text-gray-500">Weight</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Configuration Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Configuration Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  <Button onClick={saveAsPreset} className="bg-blue-600 hover:bg-blue-700">
                    <Save className="w-4 h-4 mr-2" />
                    Save as Preset
                  </Button>
                  <Button onClick={resetWeights} variant="outline">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset to Default
                  </Button>
                  <Button variant="outline">
                    <Brain className="w-4 h-4 mr-2" />
                    AI Optimize
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Presets Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Preset Configurations</CardTitle>
                <CardDescription>Quick-start with common priority patterns</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Preset</Label>
                  <Select value={selectedPreset} onValueChange={applyPreset}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a preset" />
                    </SelectTrigger>
                    <SelectContent>
                      {presets.map((preset) => (
                        <SelectItem key={preset.id} value={preset.id}>
                          <div>
                            <div className="font-medium">{preset.name}</div>
                            <div className="text-xs text-gray-500">{preset.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  {presets.map((preset) => (
                    <div
                      key={preset.id}
                      className={cn(
                        "p-3 border rounded-lg cursor-pointer transition-colors",
                        selectedPreset === preset.id ? "border-blue-500 bg-blue-50" : "hover:bg-gray-50",
                      )}
                      onClick={() => applyPreset(preset.id)}
                    >
                      <div className="font-medium text-sm mb-1">{preset.name}</div>
                      <div className="text-xs text-gray-600 mb-2">{preset.description}</div>
                      <div className="grid grid-cols-2 gap-1">
                        {Object.entries(preset.weights).map(([key, value]) => {
                          const weight = weights.find((w) => w.id === key)
                          return (
                            <div key={key} className="flex items-center space-x-1">
                              <div className={cn("w-2 h-2 rounded", weight?.color)} />
                              <span className="text-xs">{value}%</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Priority Impact Preview */}
            <Card>
              <CardHeader>
                <CardTitle>Impact Preview</CardTitle>
                <CardDescription>How your settings affect allocation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <div>
                      <div className="font-medium text-sm">High Priority Clients</div>
                      <div className="text-xs text-gray-600">Will receive</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-blue-600">
                        {Math.round((weights.find((w) => w.id === "client-priority")?.value || 0) * 0.8)}%
                      </div>
                      <div className="text-xs text-gray-500">of resources</div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <div>
                      <div className="font-medium text-sm">Worker Balance</div>
                      <div className="text-xs text-gray-600">Fairness score</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600">
                        {Math.round((weights.find((w) => w.id === "fairness")?.value || 0) * 0.9)}%
                      </div>
                      <div className="text-xs text-gray-500">balanced</div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                    <div>
                      <div className="font-medium text-sm">Task Completion</div>
                      <div className="text-xs text-gray-600">Expected rate</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-purple-600">
                        {Math.round((weights.find((w) => w.id === "fulfillment")?.value || 0) * 0.85)}%
                      </div>
                      <div className="text-xs text-gray-500">completed</div>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {Math.round(weights.reduce((sum, w) => sum + w.value, 0) / weights.length)}
                    </div>
                    <div className="text-sm text-gray-600">Overall Optimization Score</div>
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
            <span>Back to Rules</span>
          </Button>
          <div className="text-sm text-gray-600">Step 4 of 5: Prioritization Settings</div>
          <Button className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 flex items-center space-x-2">
            <span>Continue to Export</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </main>
    </div>
  )
}

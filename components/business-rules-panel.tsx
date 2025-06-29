"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Plus } from "lucide-react";

interface BusinessRule {
  id: string;
  name: string;
  description: string;
  entityType: "client" | "worker" | "tasks" | "global";
  condition: string;
  action: string;
  priority: number;
  isActive: boolean;
}

interface BusinessRulesPanelProps {
  rules: BusinessRule[];
  onRulesChange: (rules: BusinessRule[]) => void;
}

export function BusinessRulesPanel({
  rules,
  onRulesChange,
}: BusinessRulesPanelProps) {
  const [isAddingRule, setIsAddingRule] = useState(false);
  const [editingRule, setEditingRule] = useState<BusinessRule | null>(null);
  const [filterType, setFilterType] = useState<string>("all");

  const [newRule, setNewRule] = useState<Partial<BusinessRule>>({
    name: "",
    description: "",
    entityType: "global",
    condition: "",
    action: "",
    priority: 1,
    isActive: true,
  });

  const handleAddRule = () => {
    if (!newRule.name || !newRule.condition || !newRule.action) return;

    const rule: BusinessRule = {
      id: Date.now().toString(),
      name: newRule.name,
      description: newRule.description || "",
      entityType: newRule.entityType as any,
      condition: newRule.condition,
      action: newRule.action,
      priority: newRule.priority || 1,
      isActive: newRule.isActive || true,
    };

    onRulesChange([...rules, rule]);
    setNewRule({
      name: "",
      description: "",
      entityType: "global",
      condition: "",
      action: "",
      priority: 1,
      isActive: true,
    });
    setIsAddingRule(false);
  };

  const handleEditRule = () => {
    if (
      !editingRule ||
      !editingRule.name ||
      !editingRule.condition ||
      !editingRule.action
    )
      return;

    const updatedRules = rules.map((rule) =>
      rule.id === editingRule.id ? editingRule : rule
    );
    onRulesChange(updatedRules);
    setEditingRule(null);
  };

  const handleDeleteRule = (ruleId: string) => {
    const updatedRules = rules.filter((rule) => rule.id !== ruleId);
    onRulesChange(updatedRules);
  };

  const handleToggleRule = (ruleId: string) => {
    const updatedRules = rules.map((rule) =>
      rule.id === ruleId ? { ...rule, isActive: !rule.isActive } : rule
    );
    onRulesChange(updatedRules);
  };

  const filteredRules = rules.filter((rule) => {
    if (filterType === "all") return true;
    return rule.entityType === filterType;
  });

  const sortedRules = [...filteredRules].sort(
    (a, b) => b.priority - a.priority
  );

  return (
    <Card className="w-full border border-neutral-200 ">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="text-lg font-medium tracking-tight">
            Business Rules
          </span>
          <div className="flex items-center gap-4">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-32 border border-neutral-200 rounded-md bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border-neutral-200">
                <SelectItem value="all">All Rules</SelectItem>
                <SelectItem value="client">Client</SelectItem>
                <SelectItem value="worker">Worker</SelectItem>
                <SelectItem value="tasks">Tasks</SelectItem>
                <SelectItem value="global">Global</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={() => setIsAddingRule(true)}
              className="bg-white border border-neutral-200 rounded-md"
            >
              <Plus className="w-4 h-4" />
              Add Rule
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 ">
        {/* Add/Edit Rule Form */}
        {(isAddingRule || editingRule) && (
          <Card className="border bg-yellow-50 border-neutral-200 rounded-xl">
            <CardHeader>
              <CardTitle className="text-lg">
                {isAddingRule ? "Add New Rule" : "Edit Rule"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ruleName">Rule Name</Label>
                  <Input
                    className="border border-neutral-200 rounded-md bg-white mt-2"
                    id="ruleName"
                    value={isAddingRule ? newRule.name : editingRule?.name}
                    onChange={(e) =>
                      isAddingRule
                        ? setNewRule({ ...newRule, name: e.target.value })
                        : setEditingRule({
                            ...editingRule!,
                            name: e.target.value,
                          })
                    }
                    placeholder="Enter rule name"
                  />
                </div>
                <div>
                  <Label htmlFor="entityType">Entity Type</Label>
                  <Select
                    value={
                      isAddingRule
                        ? newRule.entityType
                        : editingRule?.entityType
                    }
                    onValueChange={(value) =>
                      isAddingRule
                        ? setNewRule({ ...newRule, entityType: value as any })
                        : setEditingRule({
                            ...editingRule!,
                            entityType: value as any,
                          })
                    }
                  >
                    <SelectTrigger className="border mt-2 border-neutral-200 rounded-md bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="global">Global</SelectItem>
                      <SelectItem value="client">Client</SelectItem>
                      <SelectItem value="worker">Worker</SelectItem>
                      <SelectItem value="tasks">Tasks</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  className="border border-neutral-200 mt-2 rounded-md bg-white"
                  id="description"
                  value={
                    isAddingRule
                      ? newRule.description
                      : editingRule?.description
                  }
                  onChange={(e) =>
                    isAddingRule
                      ? setNewRule({ ...newRule, description: e.target.value })
                      : setEditingRule({
                          ...editingRule!,
                          description: e.target.value,
                        })
                  }
                  placeholder="Describe what this rule does"
                />
              </div>

              <div>
                <Label htmlFor="condition">Condition</Label>
                <Textarea
                  className="border border-neutral-200 rounded-md bg-white mt-2"
                  id="condition"
                  value={
                    isAddingRule ? newRule.condition : editingRule?.condition
                  }
                  onChange={(e) =>
                    isAddingRule
                      ? setNewRule({ ...newRule, condition: e.target.value })
                      : setEditingRule({
                          ...editingRule!,
                          condition: e.target.value,
                        })
                  }
                  placeholder="e.g., PriorityLevel > 3 AND Duration > 10"
                />
              </div>

              <div>
                <Label htmlFor="action">Action</Label>
                <Textarea
                  id="action"
                  className="border border-neutral-200 rounded-md bg-white mt-2"
                  value={isAddingRule ? newRule.action : editingRule?.action}
                  onChange={(e) =>
                    isAddingRule
                      ? setNewRule({ ...newRule, action: e.target.value })
                      : setEditingRule({
                          ...editingRule!,
                          action: e.target.value,
                        })
                  }
                  placeholder="e.g., Set PriorityLevel = 5"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                      value={String(
                        isAddingRule ? newRule.priority : editingRule?.priority
                      )}
                      onValueChange={(value) =>
                        isAddingRule
                          ? setNewRule({
                              ...newRule,
                              priority: parseInt(value),
                            })
                          : setEditingRule({
                              ...editingRule!,
                              priority: parseInt(value),
                            })
                      }
                    >
                      <SelectTrigger className="w-20 border border-neutral-200 rounded-md bg-white mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5].map((p) => (
                          <SelectItem key={p} value={String(p)}>
                            {p}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="border border-neutral-200 rounded-md bg-white"
                    onClick={() => {
                      setIsAddingRule(false);
                      setEditingRule(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="border border-neutral-200 rounded-md bg-white"
                    onClick={isAddingRule ? handleAddRule : handleEditRule}
                  >
                    {isAddingRule ? "Add Rule" : "Save Changes"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Rules List */}
        <div className="space-y-3">
          {sortedRules.map((rule) => (
            <Card
              key={rule.id}
              className={`${!rule.isActive ? "opacity-60" : ""}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{rule.name}</h3>
                      <Badge variant={rule.isActive ? "default" : "secondary"}>
                        {rule.isActive ? "Active" : "Inactive"}
                      </Badge>
                      <Badge variant="outline">Priority {rule.priority}</Badge>
                      <Badge variant="outline">{rule.entityType}</Badge>
                    </div>
                    {rule.description && (
                      <p className="text-sm text-gray-600 mb-2">
                        {rule.description}
                      </p>
                    )}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Condition:</span>
                        <p className="text-gray-700 bg-gray-50 p-2 rounded mt-1">
                          {rule.condition}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium">Action:</span>
                        <p className="text-gray-700 bg-gray-50 p-2 rounded mt-1">
                          {rule.action}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleRule(rule.id)}
                    >
                      {rule.isActive ? "Disable" : "Enable"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingRule(rule)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteRule(rule.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {sortedRules.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            No business rules defined. Click "Add Rule" to create your first
            rule.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

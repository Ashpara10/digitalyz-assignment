"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { TFileType } from "@/lib/types";
import { useState } from "react";

interface PrioritizationPanelProps {
  entityType: TFileType;
  data: any[];
  onPriorityChange: (
    entityType: TFileType,
    priorities: Record<string, number>
  ) => void;
}

export function PrioritizationPanel({
  entityType,
  data,
  onPriorityChange,
}: PrioritizationPanelProps) {
  const [priorities, setPriorities] = useState<Record<string, number>>({});
  const [sortBy, setSortBy] = useState<string>("priority");

  const handlePriorityChange = (id: string, priority: number) => {
    const newPriorities = { ...priorities, [id]: priority };
    setPriorities(newPriorities);
    onPriorityChange(entityType, newPriorities);
  };

  const getEntityName = (entity: any) => {
    switch (entityType) {
      case "client":
        return entity.ClientName || entity.ClientID;
      case "tasks":
        return entity.TaskName || entity.TaskID;
      case "worker":
        return entity.WorkerName || entity.WorkerID;
      default:
        return entity.ID;
    }
  };

  const getEntityId = (entity: any) => {
    switch (entityType) {
      case "client":
        return entity.ClientID;
      case "tasks":
        return entity.TaskID;
      case "worker":
        return entity.WorkerID;
      default:
        return entity.ID;
    }
  };

  const sortedData = [...data].sort((a, b) => {
    const aPriority = priorities[getEntityId(a)] || 1;
    const bPriority = priorities[getEntityId(b)] || 1;

    if (sortBy === "priority") {
      return bPriority - aPriority; // Higher priority first
    }
    return 0;
  });

  return (
    <Card className="w-full border border-neutral-200 bg-white">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>
            Prioritization -{" "}
            {entityType.charAt(0).toUpperCase() + entityType.slice(1)}
          </span>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="priority">By Priority</SelectItem>
              <SelectItem value="name">By Name</SelectItem>
            </SelectContent>
          </Select>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4">
          {sortedData.map((entity) => {
            const entityId = getEntityId(entity);
            const currentPriority = priorities[entityId] || 1;

            return (
              <div
                key={entityId}
                className="flex items-center justify-between p-3 border border-indigo-200 bg-blue-50 shadow-md rounded-lg"
              >
                <div className="flex-1">
                  <Label className="font-medium">{getEntityName(entity)}</Label>
                  <div className="text-sm text-gray-500">ID: {entityId}</div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Priority:</span>
                    <span className="font-bold text-lg">{currentPriority}</span>
                  </div>
                  <div className="w-32">
                    <Slider
                      value={[currentPriority]}
                      onValueChange={([value]) =>
                        handlePriorityChange(entityId, value)
                      }
                      max={5}
                      min={1}
                      step={1}
                      className="w-full"
                    />
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <Button
                        key={level}
                        variant={
                          currentPriority >= level ? "default" : "outline"
                        }
                        size="sm"
                        className="w-8 h-8 p-0 border border-indigo-200 bg-white"
                        onClick={() => handlePriorityChange(entityId, level)}
                      >
                        {level}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {data.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            No {entityType} data available for prioritization
          </div>
        )}
      </CardContent>
    </Card>
  );
}

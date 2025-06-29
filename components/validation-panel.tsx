"use client";

import { useState } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  CheckCircle,
  Zap,
  XCircle,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CellErrorMap } from "@/lib/types";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(
  process.env.NEXT_PUBLIC_GEMINI_API_KEY || ""
);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

// Add these new props to ValidationPanelProps
interface ValidationPanelProps {
  cellErrorMap: CellErrorMap;
}

export function ValidationPanel({ cellErrorMap }: ValidationPanelProps) {
  if (Object.entries(cellErrorMap)?.length === 0) {
    return null;
  }

  return (
    <div className="max-w-5xl mb-8 mx-auto w-full px-6 py-6 bg-red-100 rounded-2xl space-y-4">
      {/* Summary Section */}
      <div className="border-b border-red-200 pb-4 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <h2 className="text-lg font-bold text-red-800">
            Validation Errors Summary
          </h2>
        </div>
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Badge variant="destructive" className="text-red-400">
              {Object.keys(cellErrorMap).length} Column
              {Object.keys(cellErrorMap).length !== 1 ? "s" : ""} with Errors
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-red-200 text-red-800">
              {Object.values(cellErrorMap).reduce(
                (total, errors) => total + Object.keys(errors).length,
                0
              )}{" "}
              Total Errors
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-red-200 text-red-800">
              {Object.keys(cellErrorMap).length} Affected Columns
            </Badge>
          </div>
        </div>
      </div>

      {/* Detailed Error Sections */}
      {Object.entries(cellErrorMap)?.map(([columnName, rowErrors], i) => {
        const errors = Object.values(rowErrors);
        if (errors.length === 0) return null;

        // Since errors are strings, we'll group by error message similarity
        const errorGroups = errors.reduce((acc, errorArray) => {
          if (Array.isArray(errorArray)) {
            errorArray.forEach((error) => {
              const errorKey =
                error.length > 50 ? error.substring(0, 50) + "..." : error;
              if (!acc[errorKey]) {
                acc[errorKey] = [];
              }
              acc[errorKey].push(error);
            });
          }
          return acc;
        }, {} as Record<string, string[]>);

        return (
          <div
            key={i}
            className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-600" />
                <h3 className="text-red-800 font-semibold">
                  Column: {columnName}
                </h3>
                <Badge variant="destructive" className="text-xs text-red-400">
                  {errors.length} error{errors.length !== 1 ? "s" : ""}
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              {Object.entries(errorGroups).map(([errorType, typeErrors]) => (
                <Collapsible key={errorType} className="w-full">
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-between p-2 h-auto bg-red-100 hover:bg-red-200"
                    >
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                        <span className="font-medium text-red-800">
                          {errorType}
                        </span>
                        <Badge
                          variant="outline"
                          className="text-xs bg-red-200 text-red-800"
                        >
                          {typeErrors.length}
                        </Badge>
                      </div>
                      <ChevronRight className="w-4 h-4 text-red-600 transition-transform group-data-[state=open]:rotate-90" />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2">
                    <div className="bg-white border border-red-200 rounded-md p-3">
                      <ul className="space-y-1">
                        {typeErrors.slice(0, 10).map((error, index) => (
                          <li
                            key={index}
                            className="text-sm text-red-700 flex items-start gap-2"
                          >
                            <span className="text-red-500 mt-1">•</span>
                            <div>
                              <span className="font-medium">
                                Row {index + 1}:
                              </span>{" "}
                              {error}
                            </div>
                          </li>
                        ))}
                        {typeErrors.length > 10 && (
                          <li className="text-sm text-red-600 italic">
                            ... and {typeErrors.length - 10} more errors
                          </li>
                        )}
                      </ul>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

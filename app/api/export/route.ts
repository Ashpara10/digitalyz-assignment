import { NextRequest, NextResponse } from "next/server";
import { Parser } from "json2csv";

export async function POST(req: NextRequest) {
  const { clients, workers, tasks, rules, priorities } = await req.json();

  try {
    // Generate cleaned CSV files
    const clientParser = new Parser({
      fields: [
        "ClientID",
        "ClientName",
        "PriorityLevel",
        "RequestedTaskIDs",
        "GroupTag",
        "AttributesJSON",
      ],
    });
    const workerParser = new Parser({
      fields: [
        "WorkerID",
        "WorkerName",
        "Skills",
        "AvailableSlots",
        "MaxLoadPerPhase",
        "WorkerGroup",
        "QualificationLevel",
      ],
    });
    const taskParser = new Parser({
      fields: [
        "TaskID",
        "TaskName",
        "Category",
        "Duration",
        "RequiredSkills",
        "PreferredPhases",
        "MaxConcurrent",
      ],
    });

    const clientsCSV = clientParser.parse(clients);
    const workersCSV = workerParser.parse(workers);
    const tasksCSV = taskParser.parse(tasks);

    // Generate rules.json
    const rulesConfig = {
      version: "1.0",
      timestamp: new Date().toISOString(),
      rules: rules,
      priorities: priorities,
      metadata: {
        totalClients: clients.length,
        totalWorkers: workers.length,
        totalTasks: tasks.length,
        totalRules: rules.length,
      },
    };

    // Create zip file content (simplified - in real app you'd use a proper zip library)
    const exportData = {
      files: {
        "clients.csv": clientsCSV,
        "workers.csv": workersCSV,
        "tasks.csv": tasksCSV,
        "rules.json": JSON.stringify(rulesConfig, null, 2),
      },
      summary: {
        clients: clients.length,
        workers: workers.length,
        tasks: tasks.length,
        rules: rules.length,
        priorities: Object.keys(priorities || {}).length,
      },
    };

    return NextResponse.json({
      success: true,
      data: exportData,
      message: "Export completed successfully",
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate export" },
      { status: 500 }
    );
  }
}

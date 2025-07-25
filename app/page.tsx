"use client";
import {
  AIMessage,
  BaseMessage,
  HumanMessage,
  SystemMessage,
} from "@langchain/core/messages";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import {
  AllCommunityModule,
  GridApi,
  ICellRendererParams,
  IRowNode,
  ModuleRegistry,
} from "ag-grid-community";
import { parse } from "papaparse";
import React, {
  FC,
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { FileRejection, FileWithPath, useDropzone } from "react-dropzone";
import * as XLSX from "xlsx";

import { BusinessRulesPanel } from "@/components/business-rules-panel";
import { DataTable } from "@/components/data-table";
import { ExportPanel } from "@/components/export-panel";
import { PrioritizationPanel } from "@/components/prioritization-panel";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CellErrorMap,
  clientSchema,
  taskSchema,
  TFileType,
  TValidationErrorProps,
  ValidationErrorType,
  workerSchema,
} from "@/lib/types";
import {
  capitalizeFirstLetter,
  checkMissingColumns,
  cn,
  runCoreValidations,
} from "@/lib/utils";
import { themeBalham } from "ag-grid-community";
import { Trash2, Upload } from "lucide-react";

type TFileProps = File[] | null;
ModuleRegistry.registerModules([AllCommunityModule]);

const Page = () => {
  // Store rows and columns for each entity type separately
  const [entityData, setEntityData] = React.useState<
    Record<TFileType, { rows: any[]; columns: string[] }>
  >({
    client: { rows: [], columns: [] },
    tasks: { rows: [], columns: [] },
    worker: { rows: [], columns: [] },
  });

  const [fullDataSet, setFullDataSet] = React.useState<
    Record<TFileType, TFileProps>
  >({
    client: null,
    tasks: null,
    worker: null,
  });

  const allEntityFilesUploaded = Object.values(fullDataSet).every(
    (files) => files && files.length > 0
  );

  const [validationErrors, setValidationErrors] = useState<
    Record<TFileType, TValidationErrorProps[]>
  >({
    client: [],
    tasks: [],
    worker: [],
  });

  // Business rules state
  const [businessRules, setBusinessRules] = useState<any[]>([]);

  // Priorities state
  const [priorities, setPriorities] = useState<
    Record<TFileType, Record<string, number>>
  >({
    client: {},
    worker: {},
    tasks: {},
  });

  const [activeType, setActiveType] = React.useState<TFileType | null>(null);
  const [gridApi, setGridApi] = React.useState<GridApi | null>(null);
  const [cellErrorMap, setCellErrorMap] = React.useState<CellErrorMap>({});
  const myTheme = themeBalham.withParams({ accentColor: "red" });

  // Get current entity's data for display
  const currentEntityData = activeType
    ? entityData[activeType]
    : { rows: [], columns: [] };
  const currentRows = currentEntityData.rows;
  const currentColumns = currentEntityData.columns;

  const onDrop = React.useCallback(
    (acceptedFiles: File[], activeType: TFileType) => {
      // console.log({ acceptedFiles, activeType });
      if (acceptedFiles.length === 0) return;
      setActiveType(activeType);
      setFullDataSet((prev) => ({
        ...prev,
        [activeType]: acceptedFiles,
      }));
    },
    [activeType]
  );

  const handleCSVFileUpload = (file: File, activeType: TFileType) => {
    parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        console.log("Parsed Results:", results);

        if (results?.errors.length > 0) {
          setValidationErrors((prev) => ({
            ...prev,
            [activeType]: results.errors.map((error) => ({
              type: error.type as ValidationErrorType,
              entity: activeType,
              error: error.message,
            })) as TValidationErrorProps[],
          }));
          return;
        }

        const data = results.data;
        const headers = results?.meta?.fields as string[];
        console.log("Headers:", headers);

        const missingColumnErrors = checkMissingColumns(
          headers,
          activeType,
          file
        );

        if (missingColumnErrors?.length > 0) {
          setValidationErrors((prev) => ({
            ...prev,
            [activeType]: [...(prev[activeType] || []), ...missingColumnErrors],
          }));
          return;
        }

        // Update entity data for this specific type
        setEntityData((prev) => ({
          ...prev,
          [activeType]: { rows: data, columns: headers },
        }));
      },
    });
  };

  const handleExcelFileUpload = (file: File, activeType: TFileType) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const data = e.target!.result;
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(worksheet);
      const headers = Object.keys(json[0] as string[]);
      const missingColumnErrors = checkMissingColumns(
        headers,
        activeType,
        file
      );

      if (missingColumnErrors?.length > 0) {
        setValidationErrors((prev) => ({
          ...prev,
          [activeType]: [...(prev[activeType] || []), ...missingColumnErrors],
        }));
        return;
      }

      // Update entity data for this specific type
      setEntityData((prev) => ({
        ...prev,
        [activeType]: { rows: json, columns: headers },
      }));
    };
    reader.readAsArrayBuffer(file);
  };

  const runZodValidations = (api: GridApi, entityType: TFileType) => {
    const errors: TValidationErrorProps[] = [];
    const schema = getSchemaForEntityType(entityType);

    api.forEachNode((node: IRowNode, i: number) => {
      const { success, error } = schema.safeParse(node?.data);
      if (success) {
      } else {
        errors.push({
          type: "ZodValidationError",
          entity: entityType,
          error: error?.errors.map((err: any) => err.message).join(", "),
          affectedRows: [i],
          affectedFields: error.errors.map((e: any) => String(e.path[0])),
        });
      }
    });

    const coreErrors = runCoreValidations({
      data: currentRows,
      type: entityType,
    });
    console.log({ coreErrors });
    return [...errors, ...coreErrors];
  };

  const getSchemaForEntityType = (entityType: TFileType) => {
    switch (entityType) {
      case "client":
        return clientSchema;
      case "tasks":
        return taskSchema;
      case "worker":
        return workerSchema;
      default:
        return clientSchema;
    }
  };

  const handleDropAccepted = useCallback(
    (files: FileWithPath[]) => {
      const file = files[0];
      console.log("before");
      if (!file || !activeType) return;
      console.log("after");

      if (file.name.endsWith(".xlsx")) {
        handleExcelFileUpload(file, activeType);
      } else {
        handleCSVFileUpload(file, activeType);
      }
    },
    [activeType]
  );

  const detectEntityType = (headers: string[]): TFileType | null => {
    const clientFields = ["ClientID", "ClientName", "PriorityLevel"];
    const workerFields = ["WorkerID", "WorkerName", "Skills"];
    const taskFields = ["TaskID", "TaskName", "Category"];

    if (clientFields.every((field) => headers.includes(field))) return "client";
    if (workerFields.every((field) => headers.includes(field))) return "worker";
    if (taskFields.every((field) => headers.includes(field))) return "tasks";

    return null;
  };

  const handleValidationErrorsChange = (
    entityType: TFileType,
    errors: TValidationErrorProps[]
  ) => {
    setValidationErrors((prev) => ({
      ...prev,
      [entityType]: errors,
    }));
  };

  const handleBusinessRulesChange = (rules: any[]) => {
    setBusinessRules(rules);
  };

  const handlePriorityChange = (
    entityType: TFileType,
    entityPriorities: Record<string, number>
  ) => {
    setPriorities((prev) => ({
      ...prev,
      [entityType]: entityPriorities,
    }));
  };

  return (
    <div className="flex flex-col lg:p-0 px-4 items-center relative justify-center w-full ">
      <div className="w-full h-full space-y-4">
        <h1 className="leading-none mt-10 tracking-tight text-3xl md:text-5xl font-black text-center">
          Upload CSV & Excel Files <br /> Edit and Validate and Export
        </h1>
      </div>
      {/* 
      <div {...getRootProps()} style={{ display: "none" }}>
        <input {...getInputProps()} />
      </div> */}

      {Object.keys(entityData).map((key, index) => {
        return (
          <EntityContainer
            key={index}
            setActiveType={setActiveType}
            onDropAccepted={handleDropAccepted}
            onDrop={onDrop}
            rows={entityData[key as TFileType].rows}
            entityType={key as TFileType}
            validationErrors={validationErrors[key as TFileType] || []}
            files={fullDataSet[key as TFileType] || null}
            setFiles={(files) =>
              setFullDataSet((prev) => ({
                ...prev,
                [key as TFileType]: files,
              }))
            }
            entityData={entityData}
            setEntityData={setEntityData}
            onValidationErrorsChange={handleValidationErrorsChange}
          />
        );
      })}

      {/* Prioritization Panel */}
      <section className="w-full my-8 border-b pb-10 md:pb-16 border-neutral-300 tracking-tight">
        <div className="max-w-4xl w-full mx-auto">
          <h2 className="text-2xl font-bold mb-6">Prioritization</h2>
          <Tabs defaultValue="client" className="w-full">
            <TabsList className="grid w-full border border-neutral-200 grid-cols-3">
              <TabsTrigger className="border border-neutral-200" value="client">
                Clients
              </TabsTrigger>
              <TabsTrigger className="border border-neutral-200" value="worker">
                Workers
              </TabsTrigger>
              <TabsTrigger className="border border-neutral-200" value="tasks">
                Tasks
              </TabsTrigger>
            </TabsList>
            <TabsContent value="client">
              <PrioritizationPanel
                entityType="client"
                data={entityData.client.rows}
                onPriorityChange={handlePriorityChange}
              />
            </TabsContent>
            <TabsContent value="worker">
              <PrioritizationPanel
                entityType="worker"
                data={entityData.worker.rows}
                onPriorityChange={handlePriorityChange}
              />
            </TabsContent>
            <TabsContent value="tasks">
              <PrioritizationPanel
                entityType="tasks"
                data={entityData.tasks.rows}
                onPriorityChange={handlePriorityChange}
              />
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Business Rules Panel */}
      <section className="w-full my-8 border-b pb-10 md:pb-16 border-neutral-300 tracking-tight">
        <div className="max-w-4xl w-full mx-auto">
          <h2 className="text-2xl font-bold mb-6">Business Rules</h2>
          <BusinessRulesPanel
            rules={businessRules}
            onRulesChange={handleBusinessRulesChange}
          />
        </div>
      </section>

      {/* Export Panel */}
      <section className="w-full my-8 pb-10 md:pb-16 tracking-tight">
        <div className="max-w-4xl w-full mx-auto">
          <h2 className="text-2xl font-bold mb-6">Export Data</h2>
          <ExportPanel
            clientData={entityData.client.rows}
            workerData={entityData.worker.rows}
            tasksData={entityData.tasks.rows}
            businessRules={businessRules}
            priorities={priorities}
            validationErrors={validationErrors}
          />
        </div>
      </section>
    </div>
  );
};

type TEntityContainerProps = {
  entityType: TFileType;
  rows: any[];
  validationErrors: TValidationErrorProps[];
  files: TFileProps;
  setFiles: (files: TFileProps) => void;
  setActiveType: (type: TFileType) => void;
  entityData: Record<TFileType, { rows: any[]; columns: string[] }>;
  setEntityData: (
    updater: (
      prev: Record<TFileType, { rows: any[]; columns: string[] }>
    ) => Record<TFileType, { rows: any[]; columns: string[] }>
  ) => void;
  onValidationErrorsChange: (
    entityType: TFileType,
    errors: TValidationErrorProps[]
  ) => void;
  onDropAccepted: (files: FileWithPath[]) => void;
  onDrop: (files: File[], activeType: TFileType) => void;
};

const MemoizedDataTable = memo(DataTable);
const EntityContainer = ({
  entityType,
  rows,
  validationErrors,
  setActiveType,
  onDropAccepted,
  onDrop,
  entityData,
  setFiles,
  setEntityData,
  onValidationErrorsChange,
}: TEntityContainerProps) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (files) => {
      onDrop(files, entityType);
    },
    onDropAccepted,
  });
  return (
    <section className="w-full my-8  border-b pb-10 md:pb-16 border-neutral-300 tracking-tight">
      <div
        defaultChecked={true}
        className="text-2xl  max-w-4xl mb-6 w-full mx-auto font-bold"
      >
        <div className="flex items-center justify-between w-full">
          <h2 className="text-2xl font-bold">
            {capitalizeFirstLetter(entityType)}
          </h2>

          {rows.length > 0 && (
            <div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => {
                  // Clear files for this entity
                  setFiles(null);

                  // Clear rows and columns for this entity
                  setEntityData((prev) => ({
                    ...prev,
                    [entityType]: { rows: [], columns: [] },
                  }));

                  // Clear validation errors for this entity
                  onValidationErrorsChange(entityType, []);
                }}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
      <div className="max-w-4xl w-full mx-auto">
        {rows.length > 0 ? (
          // rows.map((row, index) => {
          //   return (
          <MemoizedDataTable
            rows={rows}
            columns={entityData[entityType].columns}
            dataSet={{
              client: entityData.client.rows,
              worker: entityData.worker.rows,
              tasks: entityData.tasks.rows,
            }}
            entityType={entityType}
            validationErrors={validationErrors}
            onValidationErrorsChange={(entityType, errors) =>
              onValidationErrorsChange(entityType, errors)
            }
          />
        ) : (
          <div
            {...getRootProps()}
            className={cn(
              "w-full h-[500px] flex items-center justify-center border-4 border-dashed border-neutral-300 rounded-2xl cursor-pointer",
              isDragActive && "bg-lime-50",
              validationErrors.length > 0 && "bg-red-50 border-red-500"
            )}
          >
            <input className="hidden" {...getInputProps()} />
            <div className="flex flex-col items-center justify-center">
              <Upload
                strokeWidth={1.2}
                className="size-20 mb-4 stroke-neutral-900"
              />
              <span className="text-xl font-medium tracking-tight leading-tight mb-4">
                Drag and drop your {capitalizeFirstLetter(entityType)} <br />{" "}
                data here or click to upload
              </span>

              {validationErrors.length > 0 && (
                <div className="font-medium flex flex-col space-y-2 tracking-tight text-red-500">
                  {validationErrors.map((error, i) => {
                    return <span key={i}>{error.error}</span>;
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

type SidebarProps = {
  rows: any[];
  validationErrors: Record<TFileType, TValidationErrorProps[] | null>;
  files: Record<TFileType, TFileProps>;
  entityData: Record<TFileType, { rows: any[]; columns: string[] }>;
};

interface Message {
  text: string;
  sender: "user" | "ai";
}

// The main App component combining UI and chat logic
function Sidebar({ rows, validationErrors, files, entityData }: SidebarProps) {
  // State to store all chat messages
  const [messages, setMessages] = useState<Message[]>([]);
  // State to store the current input value of the message
  const [input, setInput] = useState<string>("");
  // State to manage loading indicator during AI response generation
  const [loading, setLoading] = useState<boolean>(false);
  // Ref to automatically scroll to the latest message
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize the LangChain Google Gemini model
  // The API key is expected to be available in the environment.
  // In a full Next.js app, this would typically come from process.env.NEXT_PUBLIC_GOOGLE_API_KEY
  // For this immersive environment, it's assumed the API key is handled externally if needed,
  // or a placeholder empty string is used if not required for basic functionality.
  const model = new ChatGoogleGenerativeAI({
    apiKey:
      (typeof process !== "undefined" &&
        process.env.NEXT_PUBLIC_GOOGLE_API_KEY) ||
      "", // Use empty string if not defined
    model: "gemini-2.0-flash", // You can use "gemini-pro-vision" for multimodal capabilities if needed
    temperature: 0.2, // Lower temperature for more consistent, less creative formatting fixes
    maxOutputTokens: 1000, // Increased max output tokens for potential larger CSV outputs
  });

  // Effect to scroll to the bottom of the chat window whenever messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Define the system message to guide the AI's behavior
  // The issue was due to unescaped backticks within the template literal.
  // Escaping them or replacing them with regular quotes resolves the syntax error.
  const csvExpertSystemPrompt = `You are an advanced CSV Formatting Expert AI. Your primary role is to ensure CSV data adheres to standard formatting rules, specifically by identifying and correcting two types of common errors: 'TooManyFields' and 'Quotes'.

 **Core Responsibilities:**

 1.  **Error Detection:**
     * **TooManyFields:** Identify rows that contain more fields (columns) than expected. The expected number of fields should be determined by the header row, or if no header is present, the first valid data row.
     * **Quotes:** Detect malformed or incorrectly used quotes. This includes:
         * Unescaped internal double quotes within a quoted field.
         * Unclosed double quotes at the end of a field.
         * Double quotes used around numeric or simple string values that do not contain delimiters (comma, newline) or other quotes, where quoting is not strictly necessary but might indicate an error if inconsistent.
         * Missing quotes for fields that *should* be quoted (i.e., contain commas (,), double quotes ("), or newlines (\\n, \\r)).

 2.  **Error Correction Strategy:**
     * **For 'TooManyFields':**
         * Assume the correct number of fields is defined by the majority of rows, or explicitly by the header.
         * Truncate excess fields from the right-hand side of the erroneous row. Do NOT add missing fields, as this indicates a different type of error.
         * Maintain the integrity of the data up to the expected number of fields.
     * **For 'Quotes':**
         * Ensure proper CSV quoting conventions:
             * Fields containing commas (,), double quotes ("), or newlines (\\n, \\r) MUST be enclosed in double quotes.
             * If a field enclosed in double quotes contains an internal double quote, that internal double quote MUST be escaped by preceding it with another double quote (e.g., "Value with ""quotes"" inside").
         * Remove extraneous quotes that are not necessary or are malformed (e.g., "text"more_text should become text"more_text or text,more_text if a comma is implied).
         * Correctly close unclosed quotes.
         * Add quotes where necessary according to CSV standards.

 **General Guidelines:**

 * **Preserve Data Integrity:** Your absolute priority is to ensure the original data values are preserved during correction, only altering formatting.
 * **Delimiter:** Assume comma (',') as the field delimiter unless explicitly specified otherwise.
 * **Line Endings:** Be tolerant of common line ending variations (\\n, \\r\\n).
 * **Output:** Return only the corrected CSV content. Do not include conversational text or explanations unless specifically asked for after the correction.
 * **Ambiguity:** If a correction is ambiguous, apply the most common and standard CSV formatting rule.`;

  // Function to handle sending a message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent default form submission behavior (page reload)
    if (!input.trim()) return; // Don't send empty messages

    const userMessage: Message = { text: input, sender: "user" };
    setMessages((prevMessages) => [...prevMessages, userMessage]); // Add user message to state
    setInput(""); // Clear input field

    setLoading(true); // Set loading state to true while waiting for AI response

    try {
      // Start with the system message to instruct the AI
      const langchainMessages: BaseMessage[] = [
        new SystemMessage(csvExpertSystemPrompt),
      ];

      // Add previous messages from the chat history
      messages.forEach((msg) => {
        if (msg.sender === "user") {
          langchainMessages.push(new HumanMessage(msg.text));
        } else {
          langchainMessages.push(new AIMessage(msg.text));
        }
      });

      // Add the current user message to the LangChain format before sending
      langchainMessages.push(new HumanMessage(userMessage.text));

      // Invoke the Gemini model with the chat history including the system prompt
      const response = await model.invoke(langchainMessages);

      // Add AI response to the messages state
      setMessages((prevMessages) => [
        ...prevMessages,
        { text: response.content as string, sender: "ai" },
      ]);
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prevMessages) => [
        ...prevMessages,
        { text: "Oops! Something went wrong. Please try again.", sender: "ai" },
      ]);
    } finally {
      setLoading(false); // Reset loading state
    }
  };

  useEffect(() => {
    if (validationErrors["client"]!.length > 0) {
      (async () => {
        const errors = validationErrors["client"]!.filter(
          (error) =>
            error.type === "FieldMismatch" ||
            error.type === "Quotes" ||
            error.type === "Delimiter"
        );
        if (errors.length > 0) {
          const langchainMessages: BaseMessage[] = [
            new SystemMessage(csvExpertSystemPrompt),
          ];
          const reader = new FileReader();
          reader.readAsText(files["client"]![0]);
          reader.onload = async () => {
            const input = reader.result as string;
            console.log({ input });
            const csvData = `Original CSV Data:\n\n${input}`;
            const msg = `I tried parsing the CSV data above, but encountered these errors:\n\n${validationErrors[
              "client"
            ]!.join("\n")}\n\nPlease provide the corrected CSV data`;
            langchainMessages.push(new HumanMessage(csvData));
            langchainMessages.push(new HumanMessage(msg));
            const response = await model.invoke(langchainMessages);

            // Add AI response to the messages state
            setMessages((prevMessages) => [
              ...prevMessages,
              { text: response.content as string, sender: "ai" },
            ]);
          };
        }
      })();
    }
  }, [validationErrors]);

  return (
    <div className="h-screen max-w-md w-full flex flex-col border-l border-neutral-200 font-inter">
      {" "}
      {/* Added font-inter */}
      <div className="w-full h-full overflow-y-auto ">
        {/* Chat messages display area */}
        <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex mb-4 ${
                msg.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[70%] rounded-xl p-3 text-sm shadow-md ${
                  msg.sender === "user"
                    ? "bg-blue-500 text-white rounded-br-none"
                    : "bg-gray-200 text-gray-800 rounded-bl-none"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          {/* Loading indicator */}
          {loading && (
            <div className="flex justify-start mb-4">
              <div className="max-w-[70%] bg-gray-200 text-gray-800 rounded-xl rounded-bl-none p-3 text-sm shadow-md">
                <div className="flex items-center">
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></span>
                  Thinking...
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} /> {/* For auto-scrolling */}
        </div>

        {/* Message input form */}
        <form
          onSubmit={handleSendMessage}
          className="p-4 sm:p-6 border-t border-gray-200  flex items-center gap-3"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 ease-in-out text-base"
            disabled={loading} // Disable input while loading
          />
          <button
            type="submit"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading || !input.trim()} // Disable button while loading or input is empty
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

export default Page;

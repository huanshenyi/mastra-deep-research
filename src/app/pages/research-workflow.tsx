import { Message, MessageContent } from "@/components/ai-elements/message";
import { Response } from "@/components/ai-elements/response";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolOutput,
} from "@/components/ai-elements/tool";
import { Loader } from "@/components/ai-elements/loader";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MASTRA_BASE_URL } from "@/constants";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type ToolUIPart } from "ai";
import { useState, useMemo } from "react";
import {
  CheckCircle2,
  XCircle,
  Search,
  AlertCircle,
  Send,
  Loader2,
} from "lucide-react";
import type { WorkflowDataPart } from "@mastra/ai-sdk";

type WorkflowData = WorkflowDataPart["data"];
type StepStatus = WorkflowData["steps"][string]["status"];

const STATUS_MAP: Record<string, ToolUIPart["state"]> = {
  running: "input-available",
  waiting: "input-available",
  suspended: "input-available",
  success: "output-available",
  failed: "output-error",
  bailed: "output-error",
};

const getStepState = (status: StepStatus): ToolUIPart["state"] => {
  return STATUS_MAP[status] || "input-available";
};

const STEP_LABELS: Record<string, string> = {
  "get-user-query": "クエリ入力",
  research: "リサーチ実行",
  approval: "結果確認",
};

const DisplayStep = ({
  step,
  title,
}: {
  step: WorkflowData["steps"][string];
  title: string;
}) => {
  return (
    <Tool defaultOpen={step.status === "suspended" || step.status === "success"}>
      <ToolHeader
        title={STEP_LABELS[title] || title}
        type="tool-data-workflow"
        state={getStepState(step.status)}
      />
      <ToolContent>
        {step.status === "suspended" && step.suspendPayload && (
          <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
              <div className="flex-1">
                <div className="font-semibold text-yellow-900 dark:text-yellow-100 mb-1">
                  入力待ち
                </div>
                <div className="text-sm text-yellow-800 dark:text-yellow-200">
                  {typeof step.suspendPayload === "object" &&
                  step.suspendPayload !== null &&
                  "message" in step.suspendPayload
                    ? typeof step.suspendPayload.message === "object" &&
                      step.suspendPayload.message !== null &&
                      "query" in step.suspendPayload.message
                      ? String((step.suspendPayload.message as { query: string }).query)
                      : String(step.suspendPayload.message ?? "")
                    : JSON.stringify(step.suspendPayload)}
                </div>
                {typeof step.suspendPayload === "object" &&
                  "summary" in step.suspendPayload && (
                    <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300 whitespace-pre-wrap">
                      {String(step.suspendPayload.summary)}
                    </div>
                  )}
              </div>
            </div>
          </div>
        )}
        <ToolOutput
          output={step.output}
          errorText={step.status === "failed" ? "ステップが失敗しました" : undefined}
        />
      </ToolContent>
    </Tool>
  );
};

const ResearchWorkflowDemo = () => {
  const [query, setQuery] = useState("");

  const { messages, sendMessage, setMessages, status } = useChat({
    transport: new DefaultChatTransport({
      api: `${MASTRA_BASE_URL}/workflow/researchWorkflow`,
      prepareSendMessagesRequest: ({ messages }) => {
        const lastMessage = messages[messages.length - 1].parts.find(
          (part) => part.type === "text",
        )?.text;
        const metadata = messages[messages.length - 1].metadata as {
          runId?: string;
          query?: string;
          approved?: boolean;
        };

        // Approve/Rejectの場合
        if (lastMessage === "Approve" || lastMessage === "Reject") {
          return {
            body: {
              runId: metadata.runId,
              step: "approval",
              resumeData: {
                approved: lastMessage === "Approve",
              },
            },
          };
        }

        // クエリ入力の場合（再開）
        if (metadata.runId && metadata.query) {
          return {
            body: {
              runId: metadata.runId,
              step: "get-user-query",
              resumeData: {
                query: metadata.query,
              },
            },
          };
        }

        // 新規開始（クエリ付き）
        return {
          body: {
            inputData: {
              query: metadata.query,
            },
          },
        };
      },
    }),
  });

  // 現在のワークフロー状態を取得
  const currentWorkflow = useMemo(() => {
    const parts = messages.flatMap((m) => m.parts);
    const workflowPart = parts.findLast(
      (part): part is WorkflowDataPart => part.type === "data-workflow",
    );
    return workflowPart ? (workflowPart.data as WorkflowData) : null;
  }, [messages]);

  // サスペンド状態のステップを特定
  const suspendedStep = useMemo(() => {
    if (!currentWorkflow) return null;
    const steps = Object.entries(currentWorkflow.steps);
    return steps.find(([_, step]) => step.status === "suspended");
  }, [currentWorkflow]);

  const prevRunId = useMemo(() => {
    const parts = messages.flatMap((m) => m.parts);
    const workflowPart = parts.findLast(
      (part): part is WorkflowDataPart => part.type === "data-workflow",
    );
    return workflowPart?.id;
  }, [messages]);

  // クエリ入力でサスペンド中
  const isWaitingForQuery =
    suspendedStep?.[0] === "get-user-query" && status === "ready";

  // 承認待ちでサスペンド中
  const isWaitingForApproval =
    suspendedStep?.[0] === "approval" && status === "ready";

  // ワークフロー開始可能
  const canStart = !currentWorkflow && status === "ready";

  // ワークフロー完了
  const isCompleted =
    (currentWorkflow?.status as string) === "completed" && status === "ready";

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setMessages([]);
    sendMessage({
      text: query,
      metadata: { query: query.trim() },
    });
    setQuery("");
  };

  const handleSubmitQuery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || !isWaitingForQuery) return;
    sendMessage({
      text: query,
      metadata: { runId: prevRunId, query: query.trim() },
    });
    setQuery("");
  };

  const handleApprove = () => {
    if (!isWaitingForApproval) return;
    sendMessage({
      text: "Approve",
      metadata: { runId: prevRunId },
    });
  };

  const handleReject = () => {
    if (!isWaitingForApproval) return;
    sendMessage({
      text: "Reject",
      metadata: { runId: prevRunId },
    });
  };

  const handleReset = () => {
    setMessages([]);
    setQuery("");
  };

  return (
    <div className="flex flex-col gap-6 h-full max-h-full p-6">
      <Card>
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-t-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
              <Search className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <CardTitle>Deep Research Workflow</CardTitle>
          </div>
          <CardDescription>
            AIを使ってトピックを深くリサーチします。クエリを入力し、結果を確認して承認してください。
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* 初期状態: クエリ入力フォーム */}
          {canStart && (
            <form onSubmit={handleStart} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="query" className="text-sm font-medium">
                  リサーチしたいトピック
                </label>
                <Textarea
                  id="query"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="例: 2024年のAI技術トレンド、量子コンピューティングの最新動向など..."
                  className="min-h-[100px] shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={!query.trim()}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-sm"
              >
                <Search className="w-4 h-4 mr-2" />
                リサーチを実行
              </Button>
            </form>
          )}

          {/* クエリ修正待ち（検索不可と判定された場合） */}
          {isWaitingForQuery && (
            <form onSubmit={handleSubmitQuery} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="query" className="text-sm font-medium">
                  クエリを修正してください
                </label>
                <Textarea
                  id="query"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="もう少し具体的なトピックを入力してください..."
                  className="min-h-[100px] shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={!query.trim()}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-sm"
              >
                <Send className="w-4 h-4 mr-2" />
                修正したクエリで再実行
              </Button>
            </form>
          )}

          {/* 承認待ち */}
          {isWaitingForApproval && (
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 border border-amber-200 dark:border-amber-800 rounded-xl">
                <div className="flex items-start gap-3">
                  <div className="p-1.5 bg-amber-100 dark:bg-amber-900/50 rounded-full mt-0.5">
                    <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    リサーチ結果を確認してください。十分な内容であれば「承認」を、追加のリサーチが必要な場合は「却下」を選択してください。
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button
                  type="button"
                  onClick={handleApprove}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-sm"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  承認
                </Button>
                <Button
                  type="button"
                  onClick={handleReject}
                  variant="destructive"
                  className="flex-1 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 transition-all duration-200 shadow-sm"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  却下
                </Button>
              </div>
            </div>
          )}

          {/* 完了状態 */}
          {isCompleted && (
            <div className="space-y-4">
              <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border border-green-200 dark:border-green-800 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-full">
                    <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="font-semibold text-green-900 dark:text-green-100">
                    リサーチが完了しました
                  </span>
                </div>
              </div>
              <Button onClick={handleReset} variant="outline" className="w-full transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800">
                新しいリサーチを開始
              </Button>
            </div>
          )}

          {/* 実行中 */}
          {status === "streaming" && (
            <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-xl border border-blue-100 dark:border-blue-800">
              <div className="relative">
                <div className="w-8 h-8 border-2 border-blue-200 dark:border-blue-800 rounded-full"></div>
                <div className="absolute top-0 left-0 w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                リサーチを実行中...
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ワークフローステップの表示 */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-4">
        {messages.map((message) => (
          <div key={message.id}>
            {message.parts.map((part, index) => {
              if (part.type === "text" && message.role === "user") {
                return (
                  <Message key={index} from={message.role}>
                    <MessageContent>
                      <Response>{part.text}</Response>
                    </MessageContent>
                  </Message>
                );
              }

              if (part.type === "data-workflow") {
                const workflow = (part as WorkflowDataPart).data as WorkflowData;
                const steps = Object.entries(workflow.steps);

                return (
                  <div key={index} className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge
                        variant={
                          (workflow.status as string) === "completed"
                            ? "default"
                            : (workflow.status as string) === "suspended"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {(workflow.status as string) === "completed"
                          ? "完了"
                          : (workflow.status as string) === "suspended"
                          ? "入力待ち"
                          : (workflow.status as string) === "running"
                          ? "実行中"
                          : workflow.status}
                      </Badge>
                    </div>
                    {steps.map(([stepId, step]) => (
                      <DisplayStep key={stepId} step={step} title={stepId} />
                    ))}
                  </div>
                );
              }

              if (part.type === "text" && message.role === "assistant") {
                return (
                  <Message key={index} from={message.role}>
                    <MessageContent>
                      <Response>{part.text}</Response>
                    </MessageContent>
                  </Message>
                );
              }

              return null;
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResearchWorkflowDemo;

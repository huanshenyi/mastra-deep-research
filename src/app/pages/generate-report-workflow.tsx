import { Message, MessageContent } from "@/components/ai-elements/message";
import { Response } from "@/components/ai-elements/response";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolOutput,
} from "@/components/ai-elements/tool";
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
  FileText,
  AlertCircle,
  Send,
  Copy,
  Check,
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
  "process-research-result": "レポート生成",
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

const GenerateReportWorkflowDemo = () => {
  const [query, setQuery] = useState("");
  const [copied, setCopied] = useState(false);

  const { messages, sendMessage, setMessages, status } = useChat({
    transport: new DefaultChatTransport({
      api: `${MASTRA_BASE_URL}/workflow/generateReportWorkflow`,
      prepareSendMessagesRequest: ({ messages }) => {
        const lastMessage = messages[messages.length - 1].parts.find(
          (part) => part.type === "text",
        )?.text;
        const metadata = messages[messages.length - 1].metadata as {
          runId?: string;
          query?: string;
          stepName?: string;
          isResume?: boolean;
          resumeType?: "approval" | "query";
        };

        // Resume（承認/却下）の場合
        if (metadata.isResume && metadata.resumeType === "approval" && metadata.runId) {
          return {
            body: {
              runId: metadata.runId,
              step: metadata.stepName || "approval",
              resumeData: {
                approved: lastMessage === "Approve",
              },
            },
          };
        }

        // Resume（クエリ修正）の場合
        if (metadata.isResume && metadata.resumeType === "query" && metadata.runId && metadata.query) {
          return {
            body: {
              runId: metadata.runId,
              step: metadata.stepName || "get-user-query",
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

  // サスペンド状態とタイプを一緒に取得
  const { suspendedStep, suspendType } = useMemo(() => {
    if (!currentWorkflow) return { suspendedStep: null, suspendType: null };

    const steps = Object.entries(currentWorkflow.steps);
    const suspended = steps.find(([_, step]) => step.status === "suspended");

    if (!suspended) return { suspendedStep: null, suspendType: null };

    const [stepName, step] = suspended;
    const payload = step.suspendPayload;

    // タイプ判定
    let type: "approval" | "query" | null = null;

    // ステップ名で判定（部分一致も含む）
    if (stepName === "approval" || stepName.includes("approval")) {
      type = "approval";
    } else if (stepName === "get-user-query" || stepName.includes("get-user-query")) {
      type = "query";
    } else if (payload && typeof payload === "object") {
      // suspendPayloadの内容で判定（ネストされたワークフローの場合）
      if ("message" in payload && String(payload.message).includes("[y/n]")) {
        type = "approval";
      } else if ("originalQuery" in payload) {
        type = "query";
      }
    }

    return { suspendedStep: suspended, suspendType: type };
  }, [currentWorkflow]);

  // デバッグログ
  console.log('currentWorkflow:', currentWorkflow);
  console.log('suspendedStep:', suspendedStep);
  console.log('suspendType:', suspendType);

  const prevRunId = useMemo(() => {
    const parts = messages.flatMap((m) => m.parts);
    const workflowPart = parts.findLast(
      (part): part is WorkflowDataPart => part.type === "data-workflow",
    );
    return workflowPart?.id;
  }, [messages]);

  // ワークフロー結果（レポート）を取得
  const workflowResult = useMemo(() => {
    if (!currentWorkflow) return null;
    const processStep = currentWorkflow.steps["process-research-result"];
    if (processStep?.status === "success" && processStep.output) {
      return processStep.output as { report?: string; completed: boolean };
    }
    return null;
  }, [currentWorkflow]);

  // クエリ入力でサスペンド中
  const isWaitingForQuery = suspendType === "query" && status === "ready";

  // 承認待ちでサスペンド中
  const isWaitingForApproval = suspendType === "approval" && status === "ready";

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
    if (!query.trim() || !isWaitingForQuery || !suspendedStep) return;
    sendMessage({
      text: query,
      metadata: {
        runId: prevRunId,
        query: query.trim(),
        stepName: suspendedStep[0],
        isResume: true,
        resumeType: "query" as const,
      },
    });
    setQuery("");
  };

  const handleApprove = () => {
    if (!isWaitingForApproval || !suspendedStep) return;
    sendMessage({
      text: "Approve",
      metadata: {
        runId: prevRunId,
        stepName: suspendedStep[0],
        isResume: true,
        resumeType: "approval" as const,
      },
    });
  };

  const handleReject = () => {
    if (!isWaitingForApproval || !suspendedStep) return;
    sendMessage({
      text: "Reject",
      metadata: {
        runId: prevRunId,
        stepName: suspendedStep[0],
        isResume: true,
        resumeType: "approval" as const,
      },
    });
  };

  const handleReset = () => {
    setMessages([]);
    setQuery("");
    setCopied(false);
  };

  const handleCopyReport = async () => {
    if (!workflowResult?.report) return;
    try {
      await navigator.clipboard.writeText(workflowResult.report);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy report:", err);
    }
  };

  return (
    <div className="flex flex-col gap-6 h-full max-h-full p-6">
      <Card>
        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 rounded-t-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
              <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <CardTitle>Generate Report Workflow</CardTitle>
          </div>
          <CardDescription>
            AIを使ってトピックを深くリサーチし、マークダウン形式のレポートを生成します。
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* 初期状態: クエリ入力フォーム */}
          {canStart && (
            <form onSubmit={handleStart} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="query" className="text-sm font-medium">
                  レポートを作成したいトピック
                </label>
                <Textarea
                  id="query"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="例: 2024年のAI技術トレンド、量子コンピューティングの最新動向など..."
                  className="min-h-[100px] shadow-sm focus:ring-purple-500 focus:border-purple-500"
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={!query.trim()}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-sm"
              >
                <FileText className="w-4 h-4 mr-2" />
                レポート生成を開始
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
                  className="min-h-[100px] shadow-sm focus:ring-purple-500 focus:border-purple-500"
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={!query.trim()}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-sm"
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
                    リサーチ結果を確認してください。十分な内容であれば「承認」を、追加のリサーチが必要な場合は「却下」を選択してください。承認するとレポートが生成されます。
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
                  承認してレポート生成
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

          {/* 完了状態（レポート表示） */}
          {isCompleted && (
            <div className="space-y-4">
              {workflowResult?.report ? (
                <>
                  <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border border-green-200 dark:border-green-800 rounded-xl">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-full">
                          <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                        <span className="font-semibold text-green-900 dark:text-green-100">
                          レポートが生成されました
                        </span>
                      </div>
                      <Button
                        onClick={handleCopyReport}
                        variant="outline"
                        size="sm"
                        className="transition-all duration-200"
                      >
                        {copied ? (
                          <>
                            <Check className="w-4 h-4 mr-2" />
                            コピーしました
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 mr-2" />
                            レポートをコピー
                          </>
                        )}
                      </Button>
                    </div>
                    <div className="prose prose-sm dark:prose-invert max-w-none bg-white dark:bg-gray-900 p-4 rounded-lg border border-green-100 dark:border-green-900 max-h-[500px] overflow-y-auto">
                      <pre className="whitespace-pre-wrap text-sm font-sans">
                        {workflowResult.report}
                      </pre>
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-6 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950/30 dark:to-amber-950/30 border border-yellow-200 dark:border-yellow-800 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-100 dark:bg-yellow-900/50 rounded-full">
                      <AlertCircle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <span className="font-semibold text-yellow-900 dark:text-yellow-100">
                      レポートの生成がスキップされました
                    </span>
                  </div>
                </div>
              )}
              <Button onClick={handleReset} variant="outline" className="w-full transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800">
                新しいレポートを作成
              </Button>
            </div>
          )}

          {/* 実行中 */}
          {status === "streaming" && (
            <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 rounded-xl border border-purple-100 dark:border-purple-800">
              <div className="relative">
                <div className="w-8 h-8 border-2 border-purple-200 dark:border-purple-800 rounded-full"></div>
                <div className="absolute top-0 left-0 w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                リサーチ・レポート生成を実行中...
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

export default GenerateReportWorkflowDemo;

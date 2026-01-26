"use client";

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputActions,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Response } from "@/components/ai-elements/response";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolOutput,
} from "@/components/ai-elements/tool";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MASTRA_BASE_URL } from "@/constants";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type ToolUIPart } from "ai";
import { useState, useMemo } from "react";
import {
  CheckCircle2,
  XCircle,
  FileText,
  Copy,
  Check,
  Sparkles,
} from "lucide-react";
import type { WorkflowDataPart } from "@mastra/ai-sdk";

// Animation wrapper component for fade-in effect
const FadeIn = ({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) => (
  <div
    className={cn(
      "animate-in fade-in slide-in-from-bottom-2 duration-300 fill-mode-both",
      className
    )}
    style={{ animationDelay: `${delay}ms` }}
  >
    {children}
  </div>
);

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
          <div className="mb-4 py-3 px-4 bg-muted/30 border-l-2 border-violet-400/50 rounded-r-md">
            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                入力待ち
              </div>
              <div className="text-sm text-foreground/80 break-words leading-relaxed">
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
                  <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {String(step.suspendPayload.summary)}
                  </div>
                )}
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

// Typing indicator component - minimal design
const TypingIndicator = () => (
  <FadeIn>
    <Message from="assistant">
      <MessageContent variant="flat">
        <div
          className="flex items-center gap-3 text-muted-foreground/70 py-2"
          role="status"
          aria-live="polite"
          aria-label="処理中"
        >
          <div className="flex gap-1.5" aria-hidden="true">
            <span className="w-1.5 h-1.5 bg-current rounded-full animate-pulse" style={{ animationDelay: "0ms" }} />
            <span className="w-1.5 h-1.5 bg-current rounded-full animate-pulse" style={{ animationDelay: "200ms" }} />
            <span className="w-1.5 h-1.5 bg-current rounded-full animate-pulse" style={{ animationDelay: "400ms" }} />
          </div>
          <span className="text-sm font-light tracking-wide">処理中</span>
        </div>
      </MessageContent>
    </Message>
  </FadeIn>
);

// Report display component - minimal design
const ReportDisplay = ({
  report,
  onCopy,
  copied,
}: {
  report: string;
  onCopy: () => void;
  copied: boolean;
}) => (
  <FadeIn className="space-y-4 mt-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <div className="w-2 h-2 rounded-full bg-emerald-500" aria-hidden="true" />
        <span className="text-sm font-medium text-foreground/80">
          レポート完成
        </span>
      </div>
      <Button
        onClick={onCopy}
        variant="ghost"
        size="sm"
        className="text-xs h-8 px-3 text-muted-foreground hover:text-foreground transition-colors"
      >
        {copied ? (
          <>
            <Check className="w-3.5 h-3.5 mr-1.5" />
            コピー済み
          </>
        ) : (
          <>
            <Copy className="w-3.5 h-3.5 mr-1.5" />
            コピー
          </>
        )}
      </Button>
    </div>
    <div className="bg-muted/30 rounded-lg p-5 max-h-[400px] overflow-y-auto border border-border/50">
      <pre className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
        {report}
      </pre>
    </div>
  </FadeIn>
);

// Approval buttons component - minimal design
const ApprovalButtons = ({
  onApprove,
  onReject,
  disabled,
}: {
  onApprove: () => void;
  onReject: () => void;
  disabled: boolean;
}) => (
  <FadeIn className="space-y-4 py-2">
    <p className="text-sm text-muted-foreground leading-relaxed">
      リサーチ結果を確認してください。内容が十分であれば「承認」を選択するとレポートが生成されます。
    </p>
    <div className="flex gap-3">
      <Button
        onClick={onApprove}
        disabled={disabled}
        size="sm"
        className="h-9 px-5 bg-foreground text-background hover:bg-foreground/90 transition-colors"
      >
        <CheckCircle2 className="w-4 h-4 mr-2" />
        承認
      </Button>
      <Button
        onClick={onReject}
        disabled={disabled}
        variant="ghost"
        size="sm"
        className="h-9 px-5 text-muted-foreground hover:text-foreground transition-colors"
      >
        <XCircle className="w-4 h-4 mr-2" />
        却下
      </Button>
    </div>
  </FadeIn>
);

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

  const currentWorkflow = useMemo(() => {
    const parts = messages.flatMap((m) => m.parts);
    const workflowPart = parts.findLast(
      (part): part is WorkflowDataPart => part.type === "data-workflow",
    );
    return workflowPart ? (workflowPart.data as WorkflowData) : null;
  }, [messages]);

  const { suspendedStep, suspendType } = useMemo(() => {
    if (!currentWorkflow) return { suspendedStep: null, suspendType: null };

    const steps = Object.entries(currentWorkflow.steps);
    const suspended = steps.find(([_, step]) => step.status === "suspended");

    if (!suspended) return { suspendedStep: null, suspendType: null };

    const [stepName, step] = suspended;
    const payload = step.suspendPayload;

    let type: "approval" | "query" | null = null;

    if (stepName === "approval" || stepName.includes("approval")) {
      type = "approval";
    } else if (stepName === "get-user-query" || stepName.includes("get-user-query")) {
      type = "query";
    } else if (payload && typeof payload === "object") {
      if ("message" in payload && String(payload.message).includes("[y/n]")) {
        type = "approval";
      } else if ("originalQuery" in payload) {
        type = "query";
      }
    }

    return { suspendedStep: suspended, suspendType: type };
  }, [currentWorkflow]);

  const prevRunId = useMemo(() => {
    const parts = messages.flatMap((m) => m.parts);
    const workflowPart = parts.findLast(
      (part): part is WorkflowDataPart => part.type === "data-workflow",
    );
    return workflowPart?.id;
  }, [messages]);

  const workflowResult = useMemo(() => {
    if (!currentWorkflow) return null;
    const processStep = currentWorkflow.steps["process-research-result"];
    if (processStep?.status === "success" && processStep.output) {
      return processStep.output as { report?: string; completed: boolean };
    }
    return null;
  }, [currentWorkflow]);

  const isWaitingForQuery = suspendType === "query" && status === "ready";
  const isWaitingForApproval = suspendType === "approval" && status === "ready";
  const canStart = !currentWorkflow && status === "ready";
  const isCompleted = (currentWorkflow?.status as string) === "completed" && status === "ready";
  const isStreaming = status === "streaming";

  const handleSubmit = (text: string) => {
    if (!text.trim()) return;

    if (isWaitingForQuery && suspendedStep) {
      sendMessage({
        text: text,
        metadata: {
          runId: prevRunId,
          query: text.trim(),
          stepName: suspendedStep[0],
          isResume: true,
          resumeType: "query" as const,
        },
      });
    } else if (canStart) {
      setMessages([]);
      sendMessage({
        text: text,
        metadata: { query: text.trim() },
      });
    }
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
    } catch {
      // Clipboard API may fail in insecure contexts
      setCopied(false);
    }
  };

  const showInput = canStart || isWaitingForQuery;

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header - minimal design */}
      <header className="shrink-0 border-b border-border/40 bg-background">
        <div className="flex items-center justify-between px-6 py-4 max-w-4xl mx-auto w-full">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-muted-foreground" />
            <h1 className="font-medium text-base tracking-tight">Generate Report</h1>
          </div>
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="text-xs text-muted-foreground hover:text-foreground h-8 px-3"
            >
              リセット
            </Button>
          )}
        </div>
      </header>

      {/* Conversation Area */}
      <Conversation>
        <ConversationContent className="max-w-3xl mx-auto px-4">
          {/* Welcome message when no messages - minimal design */}
          {messages.length === 0 && (
            <FadeIn className="flex flex-col items-center justify-center py-24 text-center">
              <div className="mb-8">
                <Sparkles className="w-10 h-10 text-muted-foreground/40" strokeWidth={1.5} />
              </div>
              <h2 className="text-2xl font-light mb-3 tracking-tight text-foreground/90">
                何について調べますか?
              </h2>
              <p className="text-sm text-muted-foreground/70 max-w-sm leading-relaxed">
                トピックを入力するとAIがリサーチを行い、レポートを生成します
              </p>
            </FadeIn>
          )}

          {/* Messages - with fade-in animations */}
          {messages.map((message, msgIndex) => (
            <FadeIn key={message.id} delay={msgIndex * 50} className="space-y-3">
              {message.parts.map((part, index) => {
                if (part.type === "text" && message.role === "user") {
                  return (
                    <Message key={index} from={message.role}>
                      <MessageContent className="bg-muted/40 rounded-2xl rounded-tr-sm px-4 py-3">
                        <span className="text-sm leading-relaxed">{part.text}</span>
                      </MessageContent>
                    </Message>
                  );
                }

                if (part.type === "data-workflow") {
                  const workflow = (part as WorkflowDataPart).data as WorkflowData;
                  const steps = Object.entries(workflow.steps);

                  return (
                    <Message key={index} from="assistant">
                      <MessageContent variant="flat">
                        <div className="space-y-4 w-full">
                          {(() => {
                            const workflowStatus = workflow.status as string;
                            return (
                              <div className="flex items-center gap-2.5">
                                <div
                                  className={`w-2 h-2 rounded-full ${
                                    workflowStatus === "completed"
                                      ? "bg-emerald-500"
                                      : workflowStatus === "suspended"
                                      ? "bg-violet-400 animate-pulse"
                                      : "bg-muted-foreground/50 animate-pulse"
                                  }`}
                                  aria-hidden="true"
                                />
                                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                  {workflowStatus === "completed"
                                    ? "完了"
                                    : workflowStatus === "suspended"
                                    ? "入力待ち"
                                    : workflowStatus === "running"
                                    ? "実行中"
                                    : workflowStatus}
                                </span>
                              </div>
                            );
                          })()}

                          {/* Workflow steps */}
                          {steps.map(([stepId, step]) => (
                            <DisplayStep key={stepId} step={step} title={stepId} />
                          ))}

                          {/* Report result */}
                          {isCompleted && workflowResult?.report && (
                            <ReportDisplay
                              report={workflowResult.report}
                              onCopy={handleCopyReport}
                              copied={copied}
                            />
                          )}

                          {/* Skipped message - minimal */}
                          {isCompleted && !workflowResult?.report && (
                            <FadeIn className="py-3 px-4 bg-muted/30 border-l-2 border-amber-400/50 rounded-r-md">
                              <span className="text-sm text-muted-foreground">
                                レポートの生成がスキップされました
                              </span>
                            </FadeIn>
                          )}
                        </div>
                      </MessageContent>
                    </Message>
                  );
                }

                if (part.type === "text" && message.role === "assistant") {
                  return (
                    <Message key={index} from={message.role}>
                      <MessageContent variant="flat" className="py-2">
                        <span className="text-sm leading-relaxed text-foreground/90">{part.text}</span>
                      </MessageContent>
                    </Message>
                  );
                }

                return null;
              })}
            </FadeIn>
          ))}

          {/* Typing indicator */}
          {isStreaming && <TypingIndicator />}

          {/* Approval buttons */}
          {isWaitingForApproval && (
            <Message from="assistant">
              <MessageContent variant="flat">
                <ApprovalButtons
                  onApprove={handleApprove}
                  onReject={handleReject}
                  disabled={isStreaming}
                />
              </MessageContent>
            </Message>
          )}

          {/* New report button after completion - minimal */}
          {isCompleted && (
            <FadeIn delay={100} className="flex justify-center py-8">
              <Button
                onClick={handleReset}
                variant="ghost"
                size="sm"
                className="gap-2 text-muted-foreground hover:text-foreground h-9 px-4"
              >
                <Sparkles className="w-4 h-4" />
                新しいレポートを作成
              </Button>
            </FadeIn>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      {/* Input Area - minimal design */}
      {showInput && (
        <div className="shrink-0 border-t border-border/40 bg-background p-4 pb-6">
          <div className="max-w-3xl mx-auto">
            <PromptInput
              onSubmit={handleSubmit}
              isSubmitting={isStreaming}
              value={query}
              className="border-border/50 shadow-none bg-muted/20 rounded-xl p-3"
            >
              <PromptInputTextarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={
                  isWaitingForQuery
                    ? "修正したトピックを入力..."
                    : "トピックを入力..."
                }
                className="min-h-12 text-sm placeholder:text-muted-foreground/50"
              />
              <PromptInputActions className="mt-1">
                <span className="text-[11px] text-muted-foreground/50 tracking-wide">
                  Enter で送信
                </span>
                <PromptInputSubmit className="h-8 px-3 rounded-lg bg-foreground text-background hover:bg-foreground/90" />
              </PromptInputActions>
            </PromptInput>
          </div>
        </div>
      )}
    </div>
  );
};

export default GenerateReportWorkflowDemo;

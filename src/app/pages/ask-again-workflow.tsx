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
import { Loader } from "@/components/ai-elements/loader";
import { MASTRA_BASE_URL } from "@/constants";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState, useMemo } from "react";
import {
    CheckCircle2,
    XCircle,
    Search,
    AlertCircle,
    Send,
    RefreshCw,
} from "lucide-react";
import type { WorkflowDataPart } from "@mastra/ai-sdk";

type WorkflowData = WorkflowDataPart["data"];

/**
 * Ask Again Workflow Demo
 *
 * クエリの検索可能性を評価するシンプルなワークフロー
 */
const AskAgainWorkflowDemo = () => {
    const [query, setQuery] = useState("");

    const { messages, sendMessage, setMessages, status } = useChat({
        transport: new DefaultChatTransport({
            api: `${MASTRA_BASE_URL}/workflow/askAgainWorkflow`,
            prepareSendMessagesRequest: ({ messages }) => {
                const metadata = messages[messages.length - 1].metadata as {
                    runId?: string;
                    query?: string;
                    isResume?: boolean;
                };

                // Resume（修正クエリ送信）の場合
                if (metadata.isResume && metadata.runId && metadata.query) {
                    return {
                        body: {
                            runId: metadata.runId,
                            step: "evaluate-searchability",
                            resumeData: {
                                query: metadata.query,
                            },
                        },
                    };
                }

                // 新規開始（初回クエリ送信）
                return {
                    body: {
                        inputData: {
                            query: metadata.query || "",
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

    // runIdを取得
    const runId = useMemo(() => {
        const parts = messages.flatMap((m) => m.parts);
        const workflowPart = parts.findLast(
            (part): part is WorkflowDataPart => part.type === "data-workflow",
        );
        return workflowPart?.id;
    }, [messages]);

    // サスペンド状態のステップを特定
    const suspendedStep = useMemo(() => {
        if (!currentWorkflow) return null;
        const steps = Object.entries(currentWorkflow.steps);
        return steps.find(([_, step]) => step.status === "suspended");
    }, [currentWorkflow]);

    // suspendPayloadからoriginalQueryを取得
    const suspendMessage = useMemo(() => {
        if (!suspendedStep) return null;
        const payload = suspendedStep[1].suspendPayload;
        if (typeof payload === "object" && payload !== null && "originalQuery" in payload) {
            return String(payload.originalQuery);
        }
        return null;
    }, [suspendedStep]);

    // ワークフロー結果を取得
    const workflowResult = useMemo(() => {
        if (!currentWorkflow) return null;
        const step = currentWorkflow.steps["evaluate-searchability"];
        if (step?.status === "success" && step.output) {
            return step.output as { isSearchable: boolean };
        }
        return null;
    }, [currentWorkflow]);

    // 状態判定
    const canStart = !currentWorkflow && status === "ready";
    const isSuspended = suspendedStep?.[0] === "evaluate-searchability" && status === "ready";
    const isCompleted = workflowResult !== null && status === "ready";
    const isProcessing = status === "streaming";

    // 初回クエリ送信
    const handleSubmitQuery = (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;
        sendMessage({
            text: query,
            metadata: { query: query.trim() },
        });
        setQuery("");
    };

    // 修正クエリ送信（resume）
    const handleResumeWithQuery = (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim() || !runId) return;
        sendMessage({
            text: query,
            metadata: { runId, query: query.trim(), isResume: true },
        });
        setQuery("");
    };

    // リセット
    const handleReset = () => {
        setMessages([]);
        setQuery("");
    };

    return (
        <div className="flex flex-col gap-6 h-full max-h-full p-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Search className="w-5 h-5" />
                        <CardTitle>クエリ評価ワークフロー</CardTitle>
                    </div>
                    <CardDescription>
                        検索クエリを入力すると、AIがそのクエリが検索可能かどうかを評価します。
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {/* 初期状態: クエリ入力 */}
                    {canStart && (
                        <form onSubmit={handleSubmitQuery} className="space-y-4">
                            <div className="space-y-2">
                                <label htmlFor="query" className="text-sm font-medium">
                                    検索クエリ
                                </label>
                                <Textarea
                                    id="query"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="検索したい内容を入力してください..."
                                    className="min-h-[80px]"
                                    required
                                />
                            </div>
                            <Button
                                type="submit"
                                disabled={!query.trim()}
                                className="w-full"
                            >
                                <Send className="w-4 h-4 mr-2" />
                                評価を開始
                            </Button>
                        </form>
                    )}

                    {/* サスペンド状態: 修正クエリ入力 */}
                    {isSuspended && (
                        <div className="space-y-4">
                            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                                <div className="flex items-start gap-2">
                                    <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                                    <div>
                                        <div className="font-medium text-yellow-900 dark:text-yellow-100">
                                            クエリの修正が必要です
                                        </div>
                                        {suspendMessage && (
                                            <div className="text-sm text-yellow-800 dark:text-yellow-200 mt-1">
                                                {suspendMessage}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <form onSubmit={handleResumeWithQuery} className="space-y-4">
                                <div className="space-y-2">
                                    <label htmlFor="revised-query" className="text-sm font-medium">
                                        修正クエリ
                                    </label>
                                    <Textarea
                                        id="revised-query"
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        placeholder="より具体的なクエリを入力してください..."
                                        className="min-h-[80px]"
                                        required
                                    />
                                </div>
                                <Button
                                    type="submit"
                                    disabled={!query.trim()}
                                    className="w-full"
                                >
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                    再評価
                                </Button>
                            </form>
                        </div>
                    )}

                    {/* 完了状態: 結果表示 */}
                    {isCompleted && workflowResult && (
                        <div className="space-y-4">
                            <div className={`p-4 rounded-lg border ${
                                workflowResult.isSearchable
                                    ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                                    : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                            }`}>
                                <div className="flex items-center gap-3">
                                    {workflowResult.isSearchable ? (
                                        <CheckCircle2 className="w-6 h-6 text-green-600" />
                                    ) : (
                                        <XCircle className="w-6 h-6 text-red-600" />
                                    )}
                                    <div>
                                        <div className="font-medium">
                                            {workflowResult.isSearchable ? "検索可能" : "検索不可"}
                                        </div>
                                        <Badge variant={workflowResult.isSearchable ? "default" : "destructive"}>
                                            isSearchable: {String(workflowResult.isSearchable)}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                            <Button onClick={handleReset} variant="outline" className="w-full">
                                新しいクエリを評価
                            </Button>
                        </div>
                    )}

                    {/* 処理中 */}
                    {isProcessing && (
                        <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
                            <Loader size={20} />
                            <span className="text-sm text-muted-foreground">
                                評価中...
                            </span>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default AskAgainWorkflowDemo;

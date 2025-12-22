# Mastra連携ガイド

このドキュメントでは、フロントエンド（React）とバックエンド（Mastra）の連携方法について解説します。

## アーキテクチャ概要

```
┌─────────────────────────────────────────────────────────────┐
│                    フロントエンド (React)                      │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  useChat hook                                            │  │
│  │    ↓                                                     │  │
│  │  DefaultChatTransport                                    │  │
│  │    ↓                                                     │  │
│  │  prepareSendMessagesRequest                              │  │
│  └─────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
              POST /workflow/:workflowId
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     バックエンド (Mastra)                      │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  workflowRoute (API エンドポイント)                        │  │
│  │    ↓                                                     │  │
│  │  Workflow 実行                                            │  │
│  │    ↓                                                     │  │
│  │  Step 1 → Step 2 → Step 3 ...                           │  │
│  │    ↓                                                     │  │
│  │  suspend/resume パターン                                   │  │
│  └─────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
               WorkflowDataPart (ストリーミング)
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    フロントエンド (React)                      │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  messages 更新                                            │  │
│  │    ↓                                                     │  │
│  │  UI 状態更新                                              │  │
│  └─────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## バックエンド設定

### Mastra インスタンスの設定

**ファイル:** `src/mastra/index.ts`

```typescript
import { Mastra } from '@mastra/core/mastra';
import { LibSQLStore } from '@mastra/libsql';
import { workflowRoute } from '@mastra/ai-sdk';

export const mastra = new Mastra({
  // ストレージ設定
  storage: new LibSQLStore({
    url: 'file:../mastra.db',
  }),

  // エージェント登録
  agents: {
    researchAgent,
    reportAgent,
    // ...
  },

  // ワークフロー登録
  workflows: {
    researchWorkflow,
    askAgainWorkflow,
    // ...
  },

  // サーバー設定
  server: {
    port: 4111,
    cors: {
      origin: "*",
      allowMethods: ["*"],
      allowHeaders: ["*"],
    },
    apiRoutes: [
      workflowRoute({
        path: "/workflow/:workflowId",
      }),
    ],
  },
});
```

### ワークフローの定義

**ファイル:** `src/mastra/workflows/researchWorkflow.ts`

```typescript
import { createWorkflow, createStep } from '@mastra/core/workflows';
import { z } from 'zod';

// ステップの定義
const getUserQueryStep = createStep({
  id: 'get-user-query',
  inputSchema: z.object({
    query: z.string(),
  }),
  outputSchema: z.object({
    query: z.string(),
  }),
  // suspend時に受け取るデータのスキーマ
  resumeSchema: z.object({
    query: z.string(),
  }),
  // suspend時に返すデータのスキーマ
  suspendSchema: z.object({
    originalQuery: z.string(),
  }),
  execute: async ({ inputData, resumeData, suspend, mastra }) => {
    // resumeDataがある場合は再開処理
    if (resumeData) {
      return { query: resumeData.query };
    }

    // 条件によってsuspend（中断）
    if (!isSearchable) {
      return await suspend({
        originalQuery: inputData.query,
      });
    }

    return { query: inputData.query };
  },
});

// ワークフローの定義
export const researchWorkflow = createWorkflow({
  id: 'research-workflow',
  inputSchema: z.object({
    query: z.string(),
  }),
  outputSchema: z.object({
    approved: z.boolean(),
    researchData: z.any(),
  }),
  steps: [getUserQueryStep, researchStep, approvalStep],
});

// ステップの連結
researchWorkflow
  .then(getUserQueryStep)
  .then(researchStep)
  .then(approvalStep)
  .commit();
```

---

## フロントエンド連携

### 基本設定

**ファイル:** `src/app/constants.ts`

```typescript
export const MASTRA_BASE_URL =
  import.meta.env.VITE_MASTRA_BASE_URL || "http://localhost:4111";
```

### useChat フックの使用

**ファイル:** `src/app/pages/research-workflow.tsx`

```typescript
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import type { WorkflowDataPart } from "@mastra/ai-sdk";
import { MASTRA_BASE_URL } from "@/constants";

const MyWorkflowPage = () => {
  const { messages, sendMessage, setMessages, status } = useChat({
    transport: new DefaultChatTransport({
      api: `${MASTRA_BASE_URL}/workflow/researchWorkflow`,
      prepareSendMessagesRequest: ({ messages }) => {
        // リクエストボディのカスタマイズ
        // ...
      },
    }),
  });

  // ...
};
```

---

## リクエスト/レスポンス構造

### リクエストパターン

#### 1. 新規ワークフロー開始

```typescript
{
  body: {
    inputData: {
      // ワークフローの初期入力データ
    }
  }
}
```

#### 2. サスペンド状態からの再開

```typescript
{
  body: {
    runId: "workflow-run-id",      // ワークフロー実行ID
    step: "step-id",               // 再開するステップID
    resumeData: {
      // ステップに渡すデータ
      query: "ユーザー入力",
    }
  }
}
```

### レスポンス構造

ストリーミングレスポンスで `WorkflowDataPart` を受信:

```typescript
type WorkflowDataPart = {
  type: "data-workflow";
  id: string;                    // runId
  data: {
    id: string;                  // ワークフローID
    status: "running" | "suspended" | "completed" | "failed";
    steps: {
      [stepId: string]: {
        status: "running" | "success" | "suspended" | "failed" | "bailed";
        output: any;             // ステップの出力
        suspendPayload?: {       // suspendした場合のペイロード
          message?: string;
          summary?: string;
          // ステップ固有のデータ
        };
      };
    };
  };
};
```

---

## prepareSendMessagesRequest の実装

```typescript
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

      // パターン1: 承認/却下アクション
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

      // パターン2: クエリ入力での再開
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

      // パターン3: 新規開始
      return {
        body: {
          inputData: {},
        },
      };
    },
  }),
});
```

---

## ワークフロー状態の取得

```typescript
import { useMemo } from "react";
import type { WorkflowDataPart } from "@mastra/ai-sdk";

type WorkflowData = WorkflowDataPart["data"];

const MyWorkflowPage = () => {
  const { messages } = useChat({ /* ... */ });

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

  // 前回のrunIdを取得（再開時に使用）
  const prevRunId = useMemo(() => {
    const parts = messages.flatMap((m) => m.parts);
    const workflowPart = parts.findLast(
      (part): part is WorkflowDataPart => part.type === "data-workflow",
    );
    return workflowPart?.id;
  }, [messages]);

  // 状態判定
  const isWaitingForQuery =
    suspendedStep?.[0] === "get-user-query" && status === "ready";
  const isWaitingForApproval =
    suspendedStep?.[0] === "approval" && status === "ready";
  const canStart = !currentWorkflow && status === "ready";
  const isCompleted =
    currentWorkflow?.status === "completed" && status === "ready";

  // ...
};
```

---

## メッセージ送信パターン

### ワークフロー開始

```typescript
const handleStart = () => {
  setMessages([]);
  sendMessage({
    text: "Start",
    metadata: {},
  });
};
```

### クエリ送信（再開）

```typescript
const handleSubmitQuery = (e: React.FormEvent) => {
  e.preventDefault();
  if (!query.trim()) return;

  sendMessage({
    text: query,
    metadata: {
      runId: prevRunId,    // 前回のrunId
      query: query.trim(), // 送信するクエリ
    },
  });
  setQuery("");
};
```

### 承認/却下

```typescript
const handleApprove = () => {
  sendMessage({
    text: "Approve",
    metadata: { runId: prevRunId },
  });
};

const handleReject = () => {
  sendMessage({
    text: "Reject",
    metadata: { runId: prevRunId },
  });
};
```

---

## ステップ状態のマッピング

```typescript
import type { ToolUIPart } from "ai";

type StepStatus = "running" | "waiting" | "suspended" | "success" | "failed" | "bailed";

const STATUS_MAP: Record<StepStatus, ToolUIPart["state"]> = {
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
```

---

## 新しいワークフローの追加手順

### 1. バックエンドでワークフローを定義

```typescript
// src/mastra/workflows/myWorkflow.ts
import { createWorkflow, createStep } from '@mastra/core/workflows';
import { z } from 'zod';

const myStep = createStep({
  id: 'my-step',
  inputSchema: z.object({ /* ... */ }),
  outputSchema: z.object({ /* ... */ }),
  execute: async ({ inputData, mastra }) => {
    // 処理
    return { /* output */ };
  },
});

export const myWorkflow = createWorkflow({
  id: 'my-workflow',
  inputSchema: z.object({ /* ... */ }),
  outputSchema: z.object({ /* ... */ }),
  steps: [myStep],
});

myWorkflow.then(myStep).commit();
```

### 2. Mastra インスタンスに登録

```typescript
// src/mastra/index.ts
import { myWorkflow } from './workflows/myWorkflow';

export const mastra = new Mastra({
  // ...
  workflows: {
    myWorkflow,  // ← 追加
    // ...
  },
});
```

### 3. フロントエンドページを作成

```typescript
// src/app/pages/my-workflow.tsx
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { MASTRA_BASE_URL } from "@/constants";

const MyWorkflowPage = () => {
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: `${MASTRA_BASE_URL}/workflow/myWorkflow`,
      prepareSendMessagesRequest: ({ messages }) => {
        // リクエスト処理
      },
    }),
  });

  return (
    // UIを実装
  );
};

export default MyWorkflowPage;
```

### 4. ルーティングに追加

```typescript
// src/app/App.tsx
import MyWorkflowPage from "./pages/my-workflow";

function App() {
  const pathname = window.location.pathname;

  const renderPage = () => {
    switch (pathname) {
      case "/my-workflow":
        return <MyWorkflowPage />;
      // ...
    }
  };

  return <div className="min-h-screen bg-background">{renderPage()}</div>;
}
```

---

## デバッグのヒント

### ワークフローの状態確認

```typescript
// コンソールでワークフロー状態を確認
useEffect(() => {
  console.log('Current workflow:', currentWorkflow);
  console.log('Suspended step:', suspendedStep);
  console.log('Status:', status);
}, [currentWorkflow, suspendedStep, status]);
```

### リクエストのログ

```typescript
prepareSendMessagesRequest: ({ messages }) => {
  const body = { /* ... */ };
  console.log('Sending request:', body);
  return { body };
}
```

### Langfuse でのトレーシング

Mastra は Langfuse と統合されており、ワークフローの実行をトレースできます:

```typescript
// src/mastra/index.ts
import { LangfuseExporter } from '@mastra/langfuse';

const exporter = new LangfuseExporter({
  publicKey: process.env.LANGFUSE_PUBLIC_KEY,
  secretKey: process.env.LANGFUSE_SECRET_KEY,
  baseUrl: process.env.LANGFUSE_BASEURL,
});

export const mastra = new Mastra({
  // ...
  observability: {
    configs: {
      langfuse: {
        sampling: { type: SamplingStrategyType.ALWAYS },
        exporters: [exporter],
      },
    },
  },
});
```

---

## 次のステップ

- [フロントエンドアーキテクチャ](./frontend-architecture.md) - プロジェクト構成の詳細
- [コンポーネントガイド](./components-guide.md) - UIコンポーネントの使い方
- [ゼロからのセットアップ](./getting-started.md) - プロジェクトのセットアップ

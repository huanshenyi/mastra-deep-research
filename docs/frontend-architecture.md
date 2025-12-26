# フロントエンドアーキテクチャ

このドキュメントでは、プロジェクトのフロントエンド構成について詳しく解説します。

## プロジェクト初期化

> **Note:** Mastra バックエンドと統合したプロジェクト構造（`src/app/` 配下にフロントエンド）で手動セットアップする場合は、
> [手動セットアップガイド](./manual-setup.md) を参照してください。

### Vite + React プロジェクトの作成

```bash
# Vite で React + TypeScript プロジェクトを作成
pnpm create vite@latest my-app -- --template react-ts
cd my-app
```

### 依存関係のインストール

#### Tailwind CSS v4

```bash
pnpm add tailwindcss @tailwindcss/vite tw-animate-css
```

#### UI コンポーネント関連

```bash
# Radix UI プリミティブ
pnpm add @radix-ui/react-avatar @radix-ui/react-collapsible @radix-ui/react-slot

# スタイリングユーティリティ
pnpm add class-variance-authority clsx tailwind-merge

# アイコン
pnpm add lucide-react
```

#### AI SDK

```bash
pnpm add ai @ai-sdk/react
```

### vite.config.ts の設定

```typescript
import path from "path";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src/app"),
    },
  },
});
```

## 技術スタック

| 技術 | バージョン | 用途 |
|------|-----------|------|
| **Vite** | 7.2.0 | ビルドツール・開発サーバー |
| **React** | 19.2.0 | UIフレームワーク |
| **TypeScript** | 5.8.3 | 型安全な開発 |
| **Tailwind CSS** | 4.1.16 | ユーティリティファーストCSS |
| **Radix UI** | - | アクセシブルなUIプリミティブ |
| **CVA** | 0.7.1 | コンポーネントバリアント管理 |
| **AI SDK** | 5.0.93 | AIストリーミング連携 |

## ディレクトリ構成

```
src/app/
├── main.tsx              # Reactエントリーポイント
├── App.tsx               # ルートコンポーネント（ルーティング）
├── index.css             # グローバルスタイル・テーマ設定
├── constants.ts          # 環境設定・定数
├── vite-env.d.ts         # Vite型定義
├── lib/
│   └── utils.ts          # ユーティリティ関数（cn関数など）
├── components/
│   ├── ui/               # 汎用UIコンポーネント
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── badge.tsx
│   │   ├── input.tsx
│   │   ├── textarea.tsx
│   │   ├── avatar.tsx
│   │   └── collapsible.tsx
│   └── ai-elements/      # AI/ワークフロー専用コンポーネント
│       ├── message.tsx
│       ├── response.tsx
│       ├── tool.tsx
│       ├── loader.tsx
│       └── code-block.tsx
└── pages/                # ページコンポーネント
    ├── research-workflow.tsx
    └── ask-again-workflow.tsx
```

## ルーティング

このプロジェクトでは、**クライアントサイドの手動ルーティング**を採用しています（Next.js App Routerではありません）。

### App.tsx - ルーティングの実装

```typescript
import ResearchWorkflowDemo from "./pages/research-workflow";
import AskAgainWorkflowDemo from "./pages/ask-again-workflow";

function App() {
    const pathname = window.location.pathname;

    const renderPage = () => {
        switch (pathname) {
            case "/ask-again":
                return <AskAgainWorkflowDemo />;
            default:
                return <ResearchWorkflowDemo />;
        }
    };

    return (
        <div className="min-h-screen bg-background">
            {renderPage()}
        </div>
    );
}

export default App;
```

### 利用可能なルート

| パス | ページコンポーネント | 説明 |
|-----|---------------------|------|
| `/` | `ResearchWorkflowDemo` | メインのリサーチワークフロー |
| `/ask-again` | `AskAgainWorkflowDemo` | クエリ評価ワークフロー |

### 新しいルートの追加方法

1. `src/app/pages/` に新しいページコンポーネントを作成
2. `App.tsx` の switch文に新しいケースを追加

```typescript
// 例: /settings ルートを追加
case "/settings":
    return <SettingsPage />;
```

## スタイリングシステム

### Tailwind CSS v4 の設定

Tailwind CSS v4 では、設定ファイル（`tailwind.config.js`）ではなく、CSSファイル内でテーマを定義します。

#### index.css の構成

```css
/* Tailwind のインポート */
@import "tailwindcss";
@import "tw-animate-css";

/* ダークモードのカスタムバリアント */
@custom-variant dark (&:is(.dark *));

/* テーマ変数の定義 */
@theme inline {
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  /* ... その他の色変数 */
}

/* ライトモード（デフォルト） */
:root {
  --radius: 0.625rem;
  --background: oklch(1 0 0);
  --foreground: oklch(0.129 0.042 264.695);
  /* ... その他の色定義 */
}

/* ダークモード */
.dark {
  --background: oklch(0.129 0.042 264.695);
  --foreground: oklch(0.984 0.003 247.858);
  /* ... ダークモード用の色定義 */
}

/* ベーススタイル */
@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

### カラーシステム

OKLCHカラースペースを使用したセマンティックカラー:

| 変数名 | 用途 |
|--------|------|
| `--background` | ページ背景 |
| `--foreground` | メインテキスト |
| `--card` | カード背景 |
| `--primary` | プライマリアクション |
| `--secondary` | セカンダリアクション |
| `--muted` | 控えめな背景 |
| `--accent` | アクセント色 |
| `--destructive` | 破壊的アクション（削除など） |
| `--border` | ボーダー色 |
| `--input` | 入力フィールド |
| `--ring` | フォーカスリング |

### ボーダー半径

```css
--radius: 0.625rem;        /* 10px - 基準値 */
--radius-sm: 6px;          /* 小さめ */
--radius-md: 8px;          /* 中間 */
--radius-lg: 10px;         /* 標準 */
--radius-xl: 14px;         /* 大きめ */
```

## コンポーネント設計パターン

### CVA (Class Variance Authority) パターン

コンポーネントのバリアント管理に CVA を使用:

```typescript
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
  // ベーススタイル
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-white hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-11 px-8",
        icon: "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);
```

### cn ユーティリティ関数

Tailwindクラスのマージに使用:

```typescript
// src/app/lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

**使用例:**

```typescript
<button className={cn(
  buttonVariants({ variant, size }),
  className  // カスタムクラスを追加
)} />
```

### Radix UI との統合

アクセシブルなUIプリミティブとして Radix UI を使用:

```typescript
import * as CollapsiblePrimitive from "@radix-ui/react-collapsible";

const Collapsible = CollapsiblePrimitive.Root;
const CollapsibleTrigger = CollapsiblePrimitive.Trigger;
const CollapsibleContent = CollapsiblePrimitive.Content;
```

### asChild パターン

Radix Slot を使用した柔軟なコンポーネント合成:

```typescript
import { Slot } from "@radix-ui/react-slot";

interface ButtonProps extends React.ComponentProps<"button"> {
  asChild?: boolean;
}

function Button({ asChild, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return <Comp {...props} />;
}

// 使用例: Link として使用
<Button asChild>
  <a href="/somewhere">リンクボタン</a>
</Button>
```

## パスエイリアス

`@/` エイリアスで `src/app/` ディレクトリを参照可能:

```typescript
// 相対パスの代わりに
import { Button } from "../../../components/ui/button";

// エイリアスを使用
import { Button } from "@/components/ui/button";
```

**設定箇所:**
- `vite.config.ts` - Vite用
- `tsconfig.json` - TypeScript用

## 環境変数

### Vite での環境変数

`VITE_` プレフィックスをつけた変数のみフロントエンドで使用可能:

```typescript
// src/app/constants.ts
export const MASTRA_BASE_URL =
  import.meta.env.VITE_MASTRA_BASE_URL || "http://localhost:4111";
```

**.env ファイル例:**

```bash
VITE_MASTRA_BASE_URL=http://localhost:4111
```

## 型定義

### Vite 環境変数の型

```typescript
// src/app/vite-env.d.ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MASTRA_BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

## 次のステップ

- [コンポーネントガイド](./components-guide.md) - 各コンポーネントの詳細な使い方
- [Mastra連携ガイド](./mastra-integration.md) - バックエンドとの連携方法

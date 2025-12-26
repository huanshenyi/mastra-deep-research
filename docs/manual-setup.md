# 手動セットアップガイド

このドキュメントでは、Mastra バックエンドと統合された Vite + React プロジェクトを手動でセットアップする方法を解説します。

## 概要

このプロジェクトは以下の構造を採用しています：

- **`src/app/`** - フロントエンド（React + Vite）
- **`src/mastra/`** - バックエンド（Mastra）
- **`src/lib/`** - 共有ライブラリ

標準的な `pnpm create vite` とは異なり、手動でディレクトリ構造を作成します。

## 1. プロジェクトの初期化

```bash
mkdir my-mastra-app
cd my-mastra-app
pnpm init
```

## 2. ディレクトリ構造の作成

```bash
# フロントエンド
mkdir -p src/app/components/ui
mkdir -p src/app/components/ai-elements
mkdir -p src/app/pages
mkdir -p src/app/lib

# バックエンド
mkdir -p src/mastra/agents
mkdir -p src/mastra/tools
mkdir -p src/mastra/workflows

# 共有ライブラリ
mkdir -p src/lib

# 静的ファイル
mkdir -p public
```

最終的な構造：

```
my-mastra-app/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── src/
│   ├── app/                    # フロントエンド
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── index.css
│   │   ├── constants.ts
│   │   ├── vite-env.d.ts
│   │   ├── lib/
│   │   │   └── utils.ts
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   └── ai-elements/
│   │   └── pages/
│   ├── mastra/                 # バックエンド
│   │   ├── index.ts
│   │   ├── agents/
│   │   ├── tools/
│   │   └── workflows/
│   └── lib/                    # 共有ライブラリ
└── public/
```

## 3. 依存関係のインストール

### フロントエンド

```bash
# React と Vite
pnpm add react react-dom
pnpm add -D vite @vitejs/plugin-react typescript @types/react @types/react-dom @types/node

# Tailwind CSS v4
pnpm add tailwindcss
pnpm add -D @tailwindcss/vite tw-animate-css

# UI コンポーネント関連
pnpm add @radix-ui/react-avatar @radix-ui/react-collapsible @radix-ui/react-slot
pnpm add class-variance-authority clsx tailwind-merge lucide-react

# AI SDK
pnpm add ai @ai-sdk/react
```

### バックエンド（Mastra）

```bash
# Mastra コア
pnpm add @mastra/core @mastra/ai-sdk
pnpm add -D mastra

# ストレージ・ロギング
pnpm add @mastra/libsql @mastra/loggers @mastra/memory

# AI プロバイダー（Amazon Bedrock の場合）
pnpm add @ai-sdk/amazon-bedrock @aws-sdk/credential-providers

# 検索API（オプション）
pnpm add exa-js
# または
pnpm add @tavily/core

# バリデーション
pnpm add zod
```

### 開発ツール

```bash
pnpm add -D concurrently
```

## 4. 設定ファイルの作成

### package.json

```json
{
  "name": "my-mastra-app",
  "version": "1.0.0",
  "type": "module",
  "engines": {
    "node": ">=22.13.0"
  },
  "scripts": {
    "mastra:dev": "mastra dev",
    "mastra:build": "mastra build",
    "mastra:start": "mastra start",
    "vite:dev": "vite",
    "vite:build": "tsc -b && vite build",
    "dev": "concurrently \"pnpm run mastra:dev\" \"pnpm run vite:dev\"",
    "build": "pnpm run mastra:build && pnpm run vite:build",
    "preview": "vite preview"
  }
}
```

### vite.config.ts

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

### tsconfig.json

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ],
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/app/*"]
    }
  }
}
```

### tsconfig.app.json（フロントエンド用）

```json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo",
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2023", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/app/*"]
    }
  },
  "include": ["src/app"]
}
```

### tsconfig.node.json（バックエンド・ビルドツール用）

```json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.node.tsbuildinfo",
    "target": "ES2022",
    "lib": ["ES2023"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "strict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true,
    "types": ["node"]
  },
  "include": ["vite.config.ts", "src/mastra/**/*", "src/lib/**/*"]
}
```

### index.html

```html
<!DOCTYPE html>
<html lang="ja">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>My Mastra App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/app/main.tsx"></script>
  </body>
</html>
```

## 5. 基本ファイルの作成

### src/app/main.tsx

```typescript
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

### src/app/App.tsx

```typescript
import MyPage from "./pages/my-page";

function App() {
  const pathname = window.location.pathname;

  const renderPage = () => {
    switch (pathname) {
      // case "/other":
      //   return <OtherPage />;
      default:
        return <MyPage />;
    }
  };

  return <div className="min-h-screen bg-background">{renderPage()}</div>;
}

export default App;
```

### src/app/constants.ts

```typescript
export const MASTRA_BASE_URL =
  import.meta.env.VITE_MASTRA_BASE_URL || "http://localhost:4111";
```

### src/app/vite-env.d.ts

```typescript
/// <reference types="vite/client" />
```

### src/app/lib/utils.ts

```typescript
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### src/app/index.css

```css
@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

@theme inline {
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
}

:root {
  --radius: 0.625rem;
  --background: oklch(1 0 0);
  --foreground: oklch(0.129 0.042 264.695);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.129 0.042 264.695);
  --primary: oklch(0.208 0.042 265.755);
  --primary-foreground: oklch(0.984 0.003 247.858);
  --secondary: oklch(0.968 0.007 247.896);
  --secondary-foreground: oklch(0.208 0.042 265.755);
  --muted: oklch(0.968 0.007 247.896);
  --muted-foreground: oklch(0.554 0.046 257.417);
  --accent: oklch(0.968 0.007 247.896);
  --accent-foreground: oklch(0.208 0.042 265.755);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.929 0.013 255.508);
  --input: oklch(0.929 0.013 255.508);
  --ring: oklch(0.704 0.04 256.788);
}

.dark {
  --background: oklch(0.129 0.042 264.695);
  --foreground: oklch(0.984 0.003 247.858);
  --card: oklch(0.208 0.042 265.755);
  --card-foreground: oklch(0.984 0.003 247.858);
  --primary: oklch(0.929 0.013 255.508);
  --primary-foreground: oklch(0.208 0.042 265.755);
  --secondary: oklch(0.279 0.041 260.031);
  --secondary-foreground: oklch(0.984 0.003 247.858);
  --muted: oklch(0.279 0.041 260.031);
  --muted-foreground: oklch(0.704 0.04 256.788);
  --accent: oklch(0.279 0.041 260.031);
  --accent-foreground: oklch(0.984 0.003 247.858);
  --destructive: oklch(0.704 0.191 22.216);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.551 0.027 264.364);
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

## 6. 開発サーバーの起動

```bash
# フロントエンドとバックエンドを同時に起動
pnpm dev

# フロントエンドのみ
pnpm vite:dev

# バックエンド（Mastra）のみ
pnpm mastra:dev
```

デフォルトの URL:
- **フロントエンド**: http://localhost:5173
- **Mastra バックエンド**: http://localhost:4111

## 7. 環境変数

`.env` ファイルを作成：

```bash
# Mastra バックエンドURL
VITE_MASTRA_BASE_URL=http://localhost:4111

# AWS Bedrock
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1

# Exa API（検索機能用）
EXA_API_KEY=your-exa-api-key
```

## 次のステップ

- [フロントエンドアーキテクチャ](./frontend-architecture.md) - スタイリング・コンポーネント設計
- [コンポーネントガイド](./components-guide.md) - UI コンポーネントの使い方
- [Mastra連携ガイド](./mastra-integration.md) - バックエンドとの連携方法

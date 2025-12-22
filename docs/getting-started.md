# ゼロからのセットアップガイド

このドキュメントでは、Vite + React + Mastra プロジェクトをゼロから構築する方法を解説します。

## 必要な環境

- **Node.js**: v22.13.0 以上
- **パッケージマネージャー**: pnpm（推奨）、npm、または yarn
- **AWS アカウント**: Amazon Bedrock を使用する場合
- **Exa API キー**: Web検索機能を使用する場合

## プロジェクトの初期化

### 1. ディレクトリの作成と初期化

```bash
mkdir my-mastra-app
cd my-mastra-app
pnpm init
```

### 2. 依存関係のインストール

#### フロントエンド依存関係

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

#### バックエンド依存関係（Mastra）

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

#### 開発ツール

```bash
pnpm add -D concurrently
```

### 3. package.json の設定

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

## 設定ファイルの作成

### 1. vite.config.ts

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

### 2. tsconfig.json

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

### 3. tsconfig.app.json（フロントエンド用）

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

### 4. tsconfig.node.json（バックエンド・ビルドツール用）

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

### 5. index.html

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

## ディレクトリ構造の作成

```bash
mkdir -p src/app/components/ui
mkdir -p src/app/components/ai-elements
mkdir -p src/app/pages
mkdir -p src/app/lib
mkdir -p src/mastra/agents
mkdir -p src/mastra/tools
mkdir -p src/mastra/workflows
mkdir -p src/lib
```

最終的なディレクトリ構造:

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
│   │   ├── main.tsx           # エントリーポイント
│   │   ├── App.tsx            # ルートコンポーネント
│   │   ├── index.css          # グローバルスタイル
│   │   ├── constants.ts       # 設定定数
│   │   ├── vite-env.d.ts      # Vite型定義
│   │   ├── lib/
│   │   │   └── utils.ts       # ユーティリティ関数
│   │   ├── components/
│   │   │   ├── ui/            # 基本UIコンポーネント
│   │   │   └── ai-elements/   # AI専用コンポーネント
│   │   └── pages/             # ページコンポーネント
│   ├── mastra/                 # バックエンド
│   │   ├── index.ts           # Mastraインスタンス
│   │   ├── agents/            # AIエージェント
│   │   ├── tools/             # ツール定義
│   │   └── workflows/         # ワークフロー定義
│   └── lib/                    # 共有ライブラリ
└── public/
    └── vite.svg
```

## 基本ファイルの作成

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
      case "/other":
        return <OtherPage />;
      default:
        return <MyPage />;
    }
  };

  return <>{renderPage()}</>;
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

Tailwind CSS v4 のスタイル設定については、[frontend-architecture.md](./frontend-architecture.md) を参照してください。

## 開発サーバーの起動

```bash
# フロントエンドとバックエンドを同時に起動
pnpm dev

# フロントエンドのみ
pnpm vite:dev

# バックエンド（Mastra）のみ
pnpm mastra:dev
```

デフォルトのURL:
- **フロントエンド**: http://localhost:5173
- **Mastra バックエンド**: http://localhost:4111

## 環境変数

`.env` ファイルを作成して環境変数を設定:

```bash
# Mastra バックエンドURL
VITE_MASTRA_BASE_URL=http://localhost:4111

# AWS Bedrock（ローカル開発用）
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1

# Exa API（検索機能用）
EXA_API_KEY=your-exa-api-key

# Langfuse（オプション：オブザーバビリティ）
LANGFUSE_PUBLIC_KEY=your-public-key
LANGFUSE_SECRET_KEY=your-secret-key
```

## 次のステップ

- [フロントエンドアーキテクチャ](./frontend-architecture.md) - プロジェクト構成の詳細
- [コンポーネントガイド](./components-guide.md) - UIコンポーネントの使い方
- [Mastra連携ガイド](./mastra-integration.md) - バックエンドとの連携方法

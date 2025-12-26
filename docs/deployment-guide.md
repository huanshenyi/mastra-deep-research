# デプロイガイド

このドキュメントでは、Vercel（フロントエンド）と Railway（バックエンド）を使用した分離デプロイの手順を解説します。

## アーキテクチャ概要

```
┌─────────────────┐         ┌─────────────────┐
│     Vercel      │         │     Railway     │
│   (Frontend)    │  ──→    │    (Backend)    │
│                 │  API    │                 │
│  Vite + React   │         │     Mastra      │
└─────────────────┘         └─────────────────┘
        │                           │
        └───── GitHub Repo ─────────┘
```

- **フロントエンド**: Vite + React 19 → Vercel
- **バックエンド**: Mastra AI → Railway（Docker）

## 前提条件

- GitHub アカウント（リポジトリをホスト）
- Vercel アカウント
- Railway アカウント
- 以下の API キー:
  - AWS 認証情報（Bedrock 用）
  - Exa または Tavily API キー（検索機能用）

## デプロイ用ファイル

プロジェクトには以下のデプロイ設定ファイルが含まれています:

| ファイル | 用途 |
|----------|------|
| `vercel.json` | Vercel デプロイ設定 |
| `Dockerfile` | Railway 用コンテナビルド |
| `railway.json` | Railway デプロイ設定 |

---

## Step 1: Railway（バックエンド）のデプロイ

バックエンドを先にデプロイして URL を取得します。

### 1.1 Railway プロジェクトの作成

1. [Railway](https://railway.app) にログイン
2. **New Project** → **Deploy from GitHub repo** を選択
3. GitHub リポジトリを選択

### 1.2 環境変数の設定

Railway ダッシュボードの **Variables** タブで以下を設定:

```bash
# 必須
NODE_ENV=production
IS_LOCAL=FALSE

# AWS Bedrock
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
# AWS_SESSION_TOKEN=your_session_token  # STS 一時認証の場合のみ

# 検索 API
TAVILY_API_KEY=your_tavily_api_key
EXA_API_KEY=your_exa_api_key

# CORS（Step 2 完了後に設定）
CORS_ORIGIN=https://your-app.vercel.app

# オプション: Langfuse（オブザーバビリティ）
LANGFUSE_PUBLIC_KEY=your_langfuse_public_key
LANGFUSE_SECRET_KEY=your_langfuse_secret_key
LANGFUSE_BASEURL=https://cloud.langfuse.com

# オプション: JWT 認証
# MASTRA_JWT_SECRET=your_jwt_secret
```

### 1.3 デプロイの確認

- Railway が自動的に `Dockerfile` を検出してビルドします
- デプロイ完了後、**Settings** → **Networking** → **Public Domain** で公開 URL を取得
- 例: `https://your-app.up.railway.app`

### 1.4 動作確認

```bash
# ヘルスチェック（エンドポイントがある場合）
curl https://your-app.up.railway.app/api/health

# ワークフロー API
curl -X POST https://your-app.up.railway.app/workflow/askAgainWorkflow \
  -H "Content-Type: application/json" \
  -d '{"inputData": {"query": "test"}}'
```

---

## Step 2: Vercel（フロントエンド）のデプロイ

### 2.1 Vercel プロジェクトの作成

1. [Vercel](https://vercel.com) にログイン
2. **Add New** → **Project** を選択
3. GitHub リポジトリをインポート

### 2.2 ビルド設定

Vercel が自動的に `vercel.json` を読み込みますが、確認のため:

| 設定 | 値 |
|------|-----|
| Framework Preset | Vite |
| Build Command | `pnpm run vite:build` |
| Output Directory | `dist` |
| Install Command | `pnpm install` |

### 2.3 環境変数の設定

**Settings** → **Environment Variables** で設定:

```bash
VITE_MASTRA_BASE_URL=https://your-app.up.railway.app
```

> **重要**: `VITE_` プレフィックスが必要です。これがないとフロントエンドで参照できません。

### 2.4 デプロイの確認

- Vercel が自動的にビルド・デプロイを実行
- デプロイ完了後、割り当てられた URL で確認
- 例: `https://your-app.vercel.app`

---

## Step 3: CORS の設定

Vercel のデプロイ完了後、Railway の CORS 設定を更新:

1. Railway ダッシュボードを開く
2. **Variables** タブで `CORS_ORIGIN` を更新:

```bash
CORS_ORIGIN=https://your-app.vercel.app
```

3. Railway が自動的に再デプロイされます

---

## 環境別の設定

### ローカル開発

```bash
# .env
VITE_MASTRA_BASE_URL=http://localhost:4111
PORT=4111
NODE_ENV=development
CORS_ORIGIN=*
IS_LOCAL=TRUE
```

### 本番環境

| 環境 | 変数 | 値 |
|------|------|-----|
| Vercel | `VITE_MASTRA_BASE_URL` | Railway の公開 URL |
| Railway | `CORS_ORIGIN` | Vercel の公開 URL |
| Railway | `IS_LOCAL` | `FALSE` |
| Railway | `NODE_ENV` | `production` |

---

## カスタムドメインの設定

### Vercel

1. **Settings** → **Domains**
2. カスタムドメインを追加
3. DNS 設定を更新

### Railway

1. **Settings** → **Networking** → **Custom Domain**
2. カスタムドメインを追加
3. DNS 設定を更新

カスタムドメイン設定後は `CORS_ORIGIN` を新しいドメインに更新:

```bash
CORS_ORIGIN=https://your-custom-domain.com
```

---

## トラブルシューティング

### CORS エラー

**症状**: ブラウザコンソールに CORS エラーが表示される

**解決策**:
1. Railway の `CORS_ORIGIN` が正しく設定されているか確認
2. URL の末尾にスラッシュがないか確認（`https://app.vercel.app` ✓、`https://app.vercel.app/` ✗）
3. Railway を再デプロイ

### API 接続エラー

**症状**: フロントエンドからバックエンドに接続できない

**解決策**:
1. Vercel の `VITE_MASTRA_BASE_URL` が正しいか確認
2. Railway のデプロイが成功しているか確認
3. Railway の Public Domain が有効か確認

### ビルドエラー（Railway）

**症状**: Docker ビルドが失敗する

**解決策**:
1. `pnpm-lock.yaml` がコミットされているか確認
2. Node.js バージョンが 22 以上か確認
3. Mastra のビルドコマンドがローカルで成功するか確認:

```bash
pnpm run mastra:build
```

### 環境変数が読み込まれない（Vercel）

**症状**: `VITE_MASTRA_BASE_URL` が `undefined`

**解決策**:
1. 変数名が `VITE_` で始まっているか確認
2. 環境変数を設定した後、再デプロイが必要
3. **Deployments** → 最新のデプロイを選択 → **Redeploy**

---

## CI/CD（オプション）

GitHub Actions を使用した自動デプロイも設定可能です。Vercel と Railway は GitHub 連携により、`main` ブランチへのプッシュで自動デプロイされます。

### 手動トリガーデプロイ

```bash
# Vercel CLI
npx vercel --prod

# Railway CLI
railway up
```

---

## 参考リンク

- [Vercel Documentation](https://vercel.com/docs)
- [Railway Documentation](https://docs.railway.app)
- [Mastra Documentation](https://mastra.ai/docs)

## 次のステップ

- [ゼロからのセットアップガイド](./getting-started.md) - 新規プロジェクトの構築
- [Mastra連携ガイド](./mastra-integration.md) - バックエンドの詳細
- [フロントエンドアーキテクチャ](./frontend-architecture.md) - フロントエンドの構成

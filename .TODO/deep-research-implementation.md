# Deep Research機能実装タスク

## 概要
現在の実装を元の2フェーズリサーチプロセスに対応させるためのタスクリスト

## タスク

### 1. researchAgent.tsの更新
- [ ] 2フェーズリサーチプロセスの指示を追加
  - Phase 1: 初期リサーチ（2-3個の検索クエリ）
  - Phase 2: フォローアップリサーチ（学習内容からのフォローアップ質問を検索）
- [ ] 無限ループ防止のガイドラインを追加
- [ ] 「デバッグ用」の記述を削除

### 2. researchWorkflow.tsのresearchStepを更新
- [ ] `experimental_output`をZodスキーマ付きで使用（構造化出力の保証）
- [ ] `maxSteps`を10から15に増加
- [ ] プロンプトを2フェーズプロセスを明示的に要求するように更新
- [ ] JSON手動パース処理を削除（experimental_outputが自動処理）

### 3. 出力スキーマの定義
- [ ] researchStepで使用するZodスキーマを定義:
  ```typescript
  z.object({
    queries: z.array(z.string()),
    searchResults: z.array(z.object({
      title: z.string(),
      url: z.string(),
      relevance: z.string(),
    })),
    learnings: z.array(z.object({
      learning: z.string(),
      followUpQuestions: z.array(z.string()),
      source: z.string(),
    })),
    completedQueries: z.array(z.string()),
    phase: z.string().optional(),
  })
  ```

### 4. テストと検証
- [ ] 2フェーズリサーチが正しく動作することを確認
- [ ] フォローアップ質問が検索されることを確認
- [ ] 無限ループが発生しないことを確認

## 参考: 元の実装

### researchAgent.ts
- 2フェーズプロセス（Phase 1: Initial Research, Phase 2: Follow-up Research）
- 無限ループ防止のガイドライン
- webSearchTool, evaluateResultTool, extractLearningsToolを使用

### researchWorkflow.ts
- `experimental_output`でZodスキーマを使用
- `maxSteps: 15`
- 構造化された出力（result.object）

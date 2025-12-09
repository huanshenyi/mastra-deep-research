import { Agent } from '@mastra/core/agent';
import { bedrock } from '../../lib/bedrock-providers';

export const queryEvaluationAgent = new Agent({
  id: 'query-evaluation-agent',
  name: 'クエリ評価エージェント',
  instructions: `あなたはユーザーの検索クエリを評価する専門家です。

与えられたクエリが以下の条件を満たすかどうかを判断してください：
- ウェブ検索で有用な結果が得られる可能性があるか
- クエリが具体的で明確か
- 検索可能なトピックか（個人情報や非公開情報ではないか）

追加のコンテキスト情報がある場合は、それも考慮して判断してください。
`,
  model: bedrock('us.anthropic.claude-haiku-4-5-20251001-v1:0'),
  // ツールなし - 判断のみを行う
});

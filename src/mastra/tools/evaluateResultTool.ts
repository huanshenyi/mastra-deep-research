import { z } from 'zod';
import { createTool } from '@mastra/core/tools';

export const evaluateResultTool = createTool({
  id: 'evaluate-result',
  description: '検索結果がリサーチクエリに関連しているか評価する',
  inputSchema: z.object({
    query: z.string().describe('元のリサーチクエリ'),
    result: z
      .object({
        title: z.string(),
        url: z.string(),
        content: z.string(),
      })
      .describe('評価する検索結果'),
    existingUrls: z.array(z.string()).describe('既に処理されたURL').optional(),
  }),
  execute: async (inputData, context) => {
    try {
      const { query, result, existingUrls = [] } = inputData;
      const { mastra } = context;

      // Check if URL already exists (only if existingUrls was provided)
      if (existingUrls && existingUrls.includes(result.url)) {
        return {
          isRelevant: false,
          reason: '既に処理されたURL',
        };
      }

      const evaluationAgent = mastra!.getAgent('evaluationAgent');

      const response = await evaluationAgent.generate(
        [
          {
            role: 'user',
            content: `この検索結果が次のクエリ「${query}」に関連しており、回答に役立つかどうかを評価してください。

        検索結果:
        タイトル: ${result.title}
        URL: ${result.url}
        コンテンツの抜粋: ${result.content.substring(0, 500)}...

        以下を含むJSONオブジェクトで応答してください:
        - isRelevant: 結果が関連しているかを示すboolean値
        - reason: 判断の簡潔な説明`,
          },
        ],
        {
          structuredOutput: {
            schema: z.object({
              isRelevant: z.boolean(),
              reason: z.string(),
            }),
          },
        },
      );

      return response.object;
    } catch (error) {
      return {
        isRelevant: false,
        reason: '評価中のエラー',
      };
    }
  },
});
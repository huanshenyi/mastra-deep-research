import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

export const extractLearningsTool = createTool({
  id: 'extract-learnings',
  description: 'Extract key learnings and follow-up questions from a search result',
  inputSchema: z.object({
    query: z.string().describe('The original research query'),
    result: z
      .object({
        title: z.string(),
        url: z.string(),
        content: z.string(),
      })
      .describe('The search result to process'),
  }),
  execute: async (inputData, context) => {
    const logger = context.mastra?.getLogger();
    try {
      const { query, result } = inputData;

      const learningExtractionAgent = context.mastra!.getAgent('learningExtractionAgent');

      const response = await learningExtractionAgent.generate(
        [
          {
            role: 'user',
            content: `ユーザーは「${query}」について調査しています。
            この検索結果から重要な学びとフォローアップ質問を抽出してください：

            タイトル: ${result.title}
            URL: ${result.url}
            内容: ${result.content.substring(0, 1500)}...

            以下の形式のJSONオブジェクトで回答してください：
            - learning: コンテンツから得られた重要な洞察（文字列）
            - followUpQuestions: より深い調査のためのフォローアップ質問（最大1つの配列）`,
          },
        ],
        {
          structuredOutput: {
            schema: z.object({
              learning: z.string(),
              followUpQuestions: z.array(z.string()).max(1),
            })
          },
        },
      );

      logger?.info('Learning extraction response:', response.object);

      return response.object;
    } catch (error) {
      logger?.error('Error extracting learnings:', error);
      return {
        learning: 'Error extracting information',
        followUpQuestions: [],
      };
    }
  },
});

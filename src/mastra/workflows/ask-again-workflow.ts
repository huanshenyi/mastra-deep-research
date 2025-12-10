import { createWorkflow, createStep } from '@mastra/core/workflows';
import { z } from 'zod';

/**
 * 検索可能性評価ステップ
 *
 * ユーザーの検索クエリをqueryEvaluationAgentを使って評価し、
 * 検索可能かどうかをbool値で返す。
 *
 * - 検索可能(true): そのまま結果を返す
 * - 検索不可(false)かつresumeDataなし: ワークフローをsuspendして修正クエリを待つ
 * - 検索不可(false)かつresumeDataあり: 再評価結果をそのまま返す
 */
const getUserQueryStep = createStep({
    id: 'get-user-query',
    inputSchema: z.object({
        query: z.string(),
    }),
    outputSchema: z.object({
        query: z.string(),
    }),
    resumeSchema: z.object({
        query: z.string(),
    }),
    suspendSchema: z.object({
        originalQuery: z.string(),
    }),
    execute: async ({ inputData, resumeData, suspend, mastra }) => {
        const query = resumeData?.query ?? inputData.query;

        const agent = mastra.getAgent('queryEvaluationAgent');

        // structuredOutputでbool値のみを返す
        const result = await agent.generate(
            `クエリ: ${query}

このクエリは検索可能ですか？`,
            {
                structuredOutput: {
                    schema: z.object({
                        isSearchable: z.boolean()
                    }),
                    jsonPromptInjection: true,
                }
            }
        );

        const isSearchable = result.object?.isSearchable ?? false;

        // resumeDataがあればそのクエリを使用
        if (resumeData) {
            return { query: resumeData.query };
        }

        // 検索不可ならsuspend
        if (!isSearchable) {
            return await suspend({
                originalQuery: `${inputData.query} 少し物足りないです。もう少し具体的にしてもらえますか？`
            });
        }

        // 検索可能ならそのまま返す
        return { query };
    },
});
/**
 * 検索クエリ評価ワークフロー
 *
 * ユーザーの検索クエリを受け取り、検索可能かどうかを判断する。
 * 検索不可の場合はsuspendし、修正されたクエリで再評価できる。
 */
export const askAgainWorkflow = createWorkflow({
    id: "ask-again-workflow",
    inputSchema: z.object({
        query: z.string().describe('検索したい内容')
    }),
    outputSchema: z.object({
        query: z.string().describe('検索可能なクエリ')
    })
})
    .then(getUserQueryStep)
    .commit();

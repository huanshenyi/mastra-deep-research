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
const evaluateSearchabilityStep = createStep({
    id: "evaluate-searchability",
    inputSchema: z.object({
        query: z.string()
    }),
    outputSchema: z.object({
        isSearchable: z.boolean()
    }),
    resumeSchema: z.object({
        query: z.string()
    }),
    suspendSchema: z.object({
        originalQuery: z.string()
    }),
    execute: async ({ inputData, resumeData, suspend, mastra }) => {
        // resumeDataがあれば修正されたクエリを使用
        const query = resumeData?.query ?? inputData.query;

        const agent = mastra.getAgent('queryEvaluationAgent');

        // structuredOutputでbool値のみを返す
        const result = await agent.generate(
            `クエリ: ${query}

このクエリは検索可能ですか？`,
            {
                output: z.object({
                    isSearchable: z.boolean()
                })
            }
        );

        const isSearchable = result.object?.isSearchable ?? false;

        // falseかつresumeDataがなければsuspend
        if (!isSearchable && !resumeData) {
            return await suspend({
                originalQuery: `${inputData.query} 少し物足りないです。もう少し具体的にしてもらえますか？`
            });
        }

        return { isSearchable };
    }
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
        isSearchable: z.boolean()
    })
})
    .then(evaluateSearchabilityStep)
    .commit();

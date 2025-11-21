import { createStep, createWorkflow } from '@mastra/core/workflows';
import { researchWorkflow } from './researchWorkflow';
import { z } from 'zod';

// リサーチ出力をレポート入力にマッピングし、条件分岐を処理
const processResearchResultStep = createStep({
  id: 'process-research-result',
  inputSchema: z.object({
    approved: z.boolean(),
    researchData: z.any(),
  }),
  outputSchema: z.object({
    report: z.string().optional(),
    completed: z.boolean(),
  }),
  execute: async ({ inputData, mastra }) => {
    // まずリサーチが承認/成功したかを判定
    const approved = inputData.approved && !!inputData.researchData;

    if (!approved) {
      console.log('リサーチが未承認または不完全のため、ワークフローを終了します');
      return { completed: false };
    }

    // 承認された場合、レポートを生成
    try {
      console.log('レポートを生成中...');
      const agent = mastra.getAgent('reportAgent');
      const response = await agent.generate([
        {
          role: 'user',
          content: `以下のリサーチ結果に基づいてレポートを生成してください: ${JSON.stringify(inputData.researchData)}`,
        },
      ]);

      console.log('レポートが正常に生成されました！');
      return { report: response.text, completed: true };
    } catch (error) {
      console.error('レポート生成エラー:', error);
      return { completed: false };
    }
  },
});

// 反復的にリサーチしてレポートを生成するワークフローを作成
export const generateReportWorkflow = createWorkflow({
  id: 'generate-report-workflow',
  steps: [researchWorkflow, processResearchResultStep],
  inputSchema: z.object({}),
  outputSchema: z.object({
    report: z.string().optional(),
    completed: z.boolean(),
  }),
});

// ワークフローのロジック:
// 1. 承認されるまでresearchWorkflowを反復実行
// 2. 承認された場合、結果を処理してレポートを生成
generateReportWorkflow
  .dowhile(researchWorkflow, async ({ inputData }) => {
    const isCompleted = inputData.approved;
    return isCompleted !== true;
  })
  .then(processResearchResultStep)
  .commit();

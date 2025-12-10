import { createWorkflow, createStep } from '@mastra/core/workflows';
import { z } from 'zod';

// ステップ1: ユーザーのクエリを取得
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

// ステップ2: リサーチ
const researchStep = createStep({
  id: 'research',
  inputSchema: z.object({
    query: z.string(),
  }),
  outputSchema: z.object({
    researchData: z.any(),
    summary: z.string(),
  }),
  execute: async ({ inputData, mastra }) => {
    const { query } = inputData;
    console.log(`Starting research for query: "${query}"`);

    try {
      const agent = mastra.getAgent('researchAgent');
      const researchPrompt = `以下のトピックをリサーチしてください: "${query}"

   結果は以下のJSON形式のみで返してください（説明文なし）:
      {
        "queries": ["検索クエリ1", "検索クエリ2"],
        "searchResults": [{"title": "...", "url": "...", "content": "..."}],
        "learnings": [{"learning": "...", "followUpQuestions": [...], "source": "..."}],
        "completedQueries": ["完了したクエリ"],
        "phase": "initial または follow-up"
      }`;


      const result = await agent.generate(researchPrompt, {
        maxSteps: 15,
      });


      console.log('Research agent result:', result.text);


      // 結果をパース
      let researchData;
      try {
        // JSONブロックを抽出
        const jsonMatch = result.text.match(/```json\s*([\s\S]*?)\s*```/) ||
          result.text.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : result.text;
        researchData = JSON.parse(jsonStr);
      } catch (parseError) {
        console.error('Failed to parse JSON:', parseError);
        researchData = {
          queries: [],
          searchResults: [],
          learnings: [],
          completedQueries: [],
          phase: 'error',
          rawText: result.text,
        };
      }


      // サマリーを作成
      const summary = `Research completed on "${query}:" \n\n ${JSON.stringify(researchData, null, 2)}\n\n`;


      return {
        researchData,
        summary,
      };

    } catch (error: any) {
      console.log({ error });
      return {
        researchData: { error: error.message },
        summary: `Error: ${error.message}`,
      };
    }
  },
});

// ステップ3: ユーザーの承認を取得
const approvalStep = createStep({
  id: 'approval',
  inputSchema: z.object({
    researchData: z.any(),
    summary: z.string(),
  }),
  outputSchema: z.object({
    approved: z.boolean(),
    researchData: z.any(),
  }),
  resumeSchema: z.object({
    approved: z.boolean(),
  }),
  execute: async ({ inputData, resumeData, suspend }) => {
    if (resumeData) {
      return {
        ...resumeData,
        researchData: inputData.researchData,
      };
    }

    await suspend({
      summary: inputData.summary,
      message: `このリサーチで十分ですか？ [y/n] `,
    });

    return {
      approved: false,
      researchData: inputData.researchData,
    };
  },
});

// ワークフローを定義
export const researchWorkflow = createWorkflow({
  id: 'research-workflow',
  inputSchema: z.object({
    query: z.string(),
  }),
  outputSchema: z.object({
    approved: z.boolean(),
    researchData: z.any(),
  }),
  steps: [getUserQueryStep, researchStep, approvalStep],
});

researchWorkflow.then(getUserQueryStep).then(researchStep).then(approvalStep).commit();

import { Mastra } from '@mastra/core/mastra';
import { LibSQLStore } from '@mastra/libsql';
import { workflowRoute } from '@mastra/ai-sdk';
import { researchWorkflow } from './workflows/researchWorkflow';
import { testWorkflow } from "./workflows/test-workflow"
import { learningExtractionAgent } from './agents/learningExtractionAgent';
import { evaluationAgent } from './agents/evaluationAgent';
import { reportAgent } from './agents/reportAgent';
import { researchAgent } from './agents/researchAgent';
import { webSummarizationAgent } from './agents/webSummarizationAgent';
import { queryEvaluationAgent } from './agents/queryEvaluationAgent';
import { askAgainWorkflow } from './workflows/ask-again-workflow';
import { generateReportWorkflow } from './workflows/generateReportWorkflow';
// import { researchWorkflow } from './workflows/testResearchWorkflow'
import { LangfuseExporter } from '@mastra/langfuse';
import { SamplingStrategyType } from '@mastra/core/ai-tracing';
import { MastraJwtAuth } from "@mastra/auth";

const exporter = new LangfuseExporter({
  publicKey: process.env.LANGFUSE_PUBLIC_KEY,
  secretKey: process.env.LANGFUSE_SECRET_KEY,
  baseUrl: process.env.LANGFUSE_BASEURL,
  realtime: process.env.NODE_ENV === "development",
  options: {
    environment: process.env.NODE_ENV,
  }
})

export const mastra = new Mastra({
  storage: new LibSQLStore({
    url: 'file:../mastra.db',
  }),
  agents: {
    researchAgent,
    reportAgent,
    evaluationAgent,
    learningExtractionAgent,
    webSummarizationAgent,
    queryEvaluationAgent,
  },
  workflows: { generateReportWorkflow, researchWorkflow, testWorkflow, askAgainWorkflow },
  observability: {
    configs: {
      langfuse: {
        sampling: { type: SamplingStrategyType.ALWAYS },
        serviceName: "ai",
        exporters: [
          exporter
        ],
      },
    },
  },
  server: {
    port: parseInt(process.env.PORT || '4111'),
    // experimental_auth: new MastraJwtAuth({
    //   secret: process.env.MASTRA_JWT_SECRET,
    // }),
    cors: {
      origin: process.env.CORS_ORIGIN || "*",
      allowMethods: ["*"],
      allowHeaders: ["*"],
    },
    apiRoutes: [
      workflowRoute({
        path: "/workflow/:workflowId",
      }),
    ],
  },
});

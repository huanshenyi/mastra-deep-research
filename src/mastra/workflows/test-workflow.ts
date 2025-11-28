import { createWorkflow, createStep } from '@mastra/core/workflows';
import { z } from 'zod';

const step1 = createStep({
  id: "step-1",
  inputSchema: z.object({
    userEmail: z.string()
  }),
  outputSchema: z.object({
    output: z.string()
  }),
  resumeSchema: z.object({
    approved: z.boolean()
  }),
  execute: async ({ inputData, resumeData, suspend }) => {
    const { userEmail } = inputData;
    const { approved } = resumeData ?? {};

    if (!approved) {
      return await suspend({});
    }

    return {
      output: `Email sent to ${userEmail}`
    };
  }
});

export const testWorkflow = createWorkflow({
  id: "test-workflow",
  inputSchema: z.object({
    userEmail: z.string()
  }),
  outputSchema: z.object({
    output: z.string()
  })
})
  .then(step1)
  .commit();
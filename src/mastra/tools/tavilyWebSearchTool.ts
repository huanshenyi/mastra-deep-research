import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { tavily } from '@tavily/core';
import 'dotenv/config';

const client = tavily({ apiKey: process.env.TAVILY_API_KEY || '' });

export const tavilyWebSearchTool = createTool({
  id: 'tavily-web-search',
  description: 'Search the web for information on a specific query using Tavily and return summarized content',
  inputSchema: z.object({
    query: z.string().describe('The search query to run'),
  }),
  execute: async (inputData, context) => {
    const logger = context.mastra?.getLogger();
    logger?.info('Executing Tavily web search tool');
    const { query } = inputData;

    try {
      if (!process.env.TAVILY_API_KEY) {
        logger?.error('Error: TAVILY_API_KEY not found in environment variables');
        return { results: [], error: 'Missing API key' };
      }

      logger?.info(`Searching web for: "${query}"`);
      const response = await client.search(query);

      if (!response.results || response.results.length === 0) {
        return { results: [], error: 'No results found' };
      }
      const processedResults = response.results.slice(0, 3).map(result => ({
        title: result.title || '',
        url: result.url,
        content: result.content ? result.content.substring(0, 1000) : 'No content available',
      }));

      return {
        results: processedResults,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        results: [],
        error: errorMessage,
      };
    }
  },
});

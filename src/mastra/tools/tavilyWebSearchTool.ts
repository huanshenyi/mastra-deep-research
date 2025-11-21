import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { tavily } from '@tavily/core';
import 'dotenv/config';

// Initialize Tavily client
const client = tavily({ apiKey: process.env.TAVILY_API_KEY || '' });

export const tavilyWebSearchTool = createTool({
  id: 'tavily-web-search',
  description: 'Search the web for information on a specific query using Tavily and return summarized content',
  inputSchema: z.object({
    query: z.string().describe('The search query to run'),
  }),
  execute: async ({ context, mastra }) => {
    const logger = mastra?.getLogger();
    logger?.info('Executing Tavily web search tool');
    const { query } = context;

    try {
      if (!process.env.TAVILY_API_KEY) {
        logger?.error('Error: TAVILY_API_KEY not found in environment variables');
        return { results: [], error: 'Missing API key' };
      }

      logger?.info(`Searching web for: "${query}"`);
      const response = await client.search(query);

      if (!response.results || response.results.length === 0) {
        console.log('No search results found');
        return { results: [], error: 'No results found' };
      }

      console.log(`Found ${response.results.length} search results`);

      // Return raw content without summarization to reduce API calls
      const processedResults = response.results.slice(0, 3).map(result => ({
        title: result.title || '',
        url: result.url,
        content: result.content ? result.content.substring(0, 1000) : 'No content available',
      }));

      return {
        results: processedResults,
      };
    } catch (error) {
      console.error('Error searching the web:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error details:', errorMessage);
      return {
        results: [],
        error: errorMessage,
      };
    }
  },
});

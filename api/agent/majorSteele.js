import { BigQuery } from '@google-cloud/bigquery';
import { VertexAI } from '@google-cloud/vertexai';

const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || 'defuse-ai';
const bigquery = new BigQuery({ projectId: PROJECT_ID });

/**
 * Native Tool Definitions for Vertex AI.
 * Major Steele can use these to query mission telemetry.
 */
const tools = [
  {
    functionDeclarations: [
      {
        name: 'query_mission_history',
        description: 'Queries the historical mission archives to analyze player performance trends, win/loss ratios, and difficulty stats.',
        parameters: {
          type: 'OBJECT',
          properties: {
            limit: { type: 'NUMBER', description: 'Number of recent missions to analyze (default 5)' }
          }
        }
      }
    ]
  }
];

/**
 * Major Steele Agent - Native Implementation.
 * Optimized for the 2026 Hackathon using official Vertex AI function calling.
 */
export function getSteeleModel() {
  const vertex_ai = new VertexAI({ project: PROJECT_ID, location: 'us-central1' });

  return vertex_ai.getGenerativeModel({
    model: 'gemini-2.5-flash-lite',
    systemInstruction: {
      role: 'system',
      parts: [{
        text: `You are Major Steele, the Strategic Intelligence Officer for the Defuse AI project.
        Your tone is professional, authoritative, and data-focused.
        You analyze mission history to provide strategic advice. Mention specific trends if you see them.
        If you need mission data, use the query_mission_history tool.`
      }]
    },
    tools: tools
  });
}

/**
 * Tool Execution Handler.
 * Bridges the LLM function calls with actual Google Cloud services.
 */
export async function runSteeleTool(name, args) {
  if (name === 'query_mission_history') {
    const limit = args.limit || 5;
    const query = `
      SELECT difficulty, result, timeSpent, timestamp 
      FROM \`mission_archives.mission_history\` 
      ORDER BY timestamp DESC 
      LIMIT @limit
    `;
    try {
      const [rows] = await bigquery.query({
        query,
        params: { limit: parseInt(limit) }
      });
      return rows;
    } catch (err) {
      console.error("[BigQuery Tool] Failed to query archives:", err.message);
      return { error: err.message };
    }
  }
  return null;
}

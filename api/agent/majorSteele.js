import { Agent, Tool } from './Agency.js';
import { BigQuery } from '@google-cloud/bigquery';
import { VertexAI } from '@google-cloud/vertexai';

/**
 * Tactical Intel Tool.
 * Allows Major Steele to query the BigQuery mission archives.
 */
class BigQueryTool extends Tool {
  constructor(projectId) {
    super({
      name: 'query_mission_archives',
      description: 'Queries the historical mission archives to analyze player performance trends, win/loss ratios, and difficulty stats.',
      parameters: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Number of recent missions to analyze' }
        }
      }
    });
    this.bigquery = new BigQuery({ projectId });
  }

  async run({ limit = 5 }) {
    const query = `
      SELECT difficulty, result, timeSpent, timestamp 
      FROM \`mission_archives.mission_history\` 
      ORDER BY timestamp DESC 
      LIMIT @limit
    `;
    try {
      const [rows] = await this.bigquery.query({
        query,
        params: { limit: parseInt(limit) }
      });
      return JSON.stringify(rows);
    } catch (err) {
      return `Error querying archives: ${err.message}`;
    }
  }
}

/**
 * Major Steele Agent.
 * An Agentic Intelligence Officer built with a custom lightweight framework
 * powered by the Official Google Cloud Vertex AI SDK.
 */
export function createSteeleAgent(projectId) {
  // Initialize Vertex AI
  // This natively supports Service Accounts/ADC if apiKey is null!
  const vertex_ai = new VertexAI({ project: projectId, location: 'us-central1' });

  const agent = new Agent({
    name: 'Major Steele',
    description: 'A strategic intelligence officer specializing in data-driven bomb disposal analysis.',
    instruction: `You are Major Steele, the Strategic Intelligence Officer for the Defuse AI project.
    Your tone is professional, authoritative, and data-focused.
    You analyze mission history to provide strategic advice. Mention specific trends if you see them.`,
    model: 'gemini-2.5-flash-lite',
    client: vertex_ai
  });

  agent.addTool(new BigQueryTool(projectId));
  return agent;
}

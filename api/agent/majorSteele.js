import { Agent, Tool } from '@google/adk';
import { BigQuery } from '@google-cloud/bigquery';

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
    const options = {
      query,
      params: { limit: parseInt(limit) }
    };
    try {
      const [rows] = await this.bigquery.query(options);
      return JSON.stringify(rows);
    } catch (err) {
      return `Error querying archives: ${err.message}`;
    }
  }
}

/**
 * Major Steele Agent.
 * An Agentic Intelligence Officer built with the Google Cloud ADK.
 */
export function createSteeleAgent(projectId, apiKey) {
  const agent = new Agent({
    name: 'Major Steele',
    description: 'A strategic intelligence officer specializing in data-driven bomb disposal analysis.',
    instruction: `You are Major Steele, the Strategic Intelligence Officer for the Defuse AI project.
    Your tone is professional, authoritative, and data-focused.
    You have access to the mission archives (BigQuery). When asked about performance, use your tools to query data before responding.
    Don't just give numbers; interpret them for the soldier. (e.g., "Your survival time on Legend difficulty is improving, keep it up").`,
    apiKey: apiKey,
    model: 'gemini-1.5-pro' // Use Pro for agentic reasoning
  });

  agent.addTool(new BigQueryTool(projectId));
  return agent;
}

import { BigQuery } from '@google-cloud/bigquery';
import { VertexAI } from '@google-cloud/vertexai';

const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || 'defuse-ai';
const DATASET_ID  = 'mission_archives';
const TABLE_ID    = 'mission_history';

// ─── BigQuery client ────────────────────────────────────────
const bigquery = new BigQuery({ projectId: PROJECT_ID });

/**
 * Ensure the BigQuery dataset and table exist before querying.
 * This prevents "not found" errors when archives are empty or
 * the table was never created (e.g. fresh Cloud Run deployment).
 */
async function ensureArchivesExist() {
  try {
    const [datasets] = await bigquery.getDatasets();
    const datasetExists = datasets.some(d => d.id === DATASET_ID);

    if (!datasetExists) {
      await bigquery.createDataset(DATASET_ID, { location: 'US' });
      console.log(`[BigQuery] Created dataset: ${DATASET_ID}`);
    }

    const dataset = bigquery.dataset(DATASET_ID);
    const [tables] = await dataset.getTables();
    const tableExists = tables.some(t => t.id === TABLE_ID);

    if (!tableExists) {
      await dataset.createTable(TABLE_ID, {
        schema: {
          fields: [
            { name: 'missionId',     type: 'STRING'    },
            { name: 'timestamp',     type: 'TIMESTAMP' },
            { name: 'difficulty',    type: 'STRING'    },
            { name: 'result',        type: 'STRING'    },
            { name: 'timeSpent',     type: 'INTEGER'   },
            { name: 'tilesCleared', type: 'INTEGER'   },
            { name: 'aiAdviceCount', type: 'INTEGER'   },
          ],
        },
      });
      console.log(`[BigQuery] Created table: ${TABLE_ID}`);
    }
  } catch (err) {
    // Non-fatal — degrade gracefully if permissions are missing
    console.warn('[BigQuery] Could not ensure archives exist:', err.message);
  }
}

// ─── Tool Definitions (Vertex AI Function Calling) ───────────
const tools = [
  {
    functionDeclarations: [
      {
        name: 'query_mission_history',
        description: 'Queries the player\'s mission archive from BigQuery to analyze performance trends, win/loss rates, average times, and difficulty breakdowns.',
        parameters: {
          type: 'OBJECT',
          properties: {
            limit: {
              type: 'NUMBER',
              description: 'Number of recent missions to retrieve (default 10, max 50)',
            },
          },
        },
      },
    ],
  },
];

/**
 * Execute the BigQuery mission history tool.
 * Returns a summary string suitable for the Vertex AI model to read.
 */
async function runQueryTool(args) {
  const limit = Math.min(parseInt(args?.limit) || 10, 50);

  try {
    const query = `
      SELECT difficulty, result, timeSpent, tilesCleared, timestamp
      FROM \`${PROJECT_ID}.${DATASET_ID}.${TABLE_ID}\`
      ORDER BY timestamp DESC
      LIMIT @limit
    `;

    const [rows] = await bigquery.query({
      query,
      params: { limit },
      location: 'US',
    });

    if (!rows || rows.length === 0) {
      return 'No mission records found in the archive yet. This appears to be one of the soldier\'s first missions.';
    }

    // Compute summary stats
    const wins      = rows.filter(r => r.result === 'success').length;
    const losses    = rows.filter(r => r.result === 'fail').length;
    const surrenders = rows.filter(r => r.result === 'surrender').length;
    const avgTime   = Math.round(rows.reduce((s, r) => s + (r.timeSpent || 0), 0) / rows.length);
    const winRate   = rows.length > 0 ? Math.round((wins / rows.length) * 100) : 0;

    const diffBreakdown = rows.reduce((acc, r) => {
      acc[r.difficulty] = (acc[r.difficulty] || 0) + 1;
      return acc;
    }, {});

    return JSON.stringify({
      totalMissions:   rows.length,
      wins,
      losses,
      surrenders,
      winRate:         `${winRate}%`,
      avgTimeSeconds:  avgTime,
      difficultyBreakdown: diffBreakdown,
      recentMissions:  rows.slice(0, 5).map(r => ({
        difficulty: r.difficulty,
        result:     r.result,
        timeSpent:  r.timeSpent,
      })),
    });
  } catch (err) {
    console.error('[BigQuery Tool] Query failed:', err.message);
    return `Archive query failed: ${err.message}. Provide a debrief based on the current game data only.`;
  }
}

/**
 * Get a strategic post-game debrief from Vertex AI (gemini-2.5-flash-lite).
 *
 * @param {object} gameData  - { difficulty, result, timeSpent, tilesCleared, aiAdviceCount }
 * @returns {Promise<string>} The debrief text.
 */
export async function getStrategicDebrief(gameData) {
  const { difficulty, result, timeSpent, tilesCleared, aiAdviceCount } = gameData;

  // Pre-check: ensure the archive table exists (best-effort)
  await ensureArchivesExist();

  const vertex = new VertexAI({ project: PROJECT_ID, location: 'us-central1' });
  const model  = vertex.getGenerativeModel({
    model: 'gemini-2.5-flash-lite',
    systemInstruction: {
      role: 'system',
      parts: [{
        text: `You are Major Steele, a data-driven strategic analyst for the Defuse AI bomb disposal program.
You have access to the mission archives database via the query_mission_history tool.
Always call this tool first to get historical context before writing your debrief.
Your debrief is brief (3-4 sentences max), data-grounded, and militarily formal.
Mention specific numbers from the archive (win rate, average time, mission count).
Compare the current mission to historical performance. Be encouraging but analytical.
Never mention AI, BigQuery, or databases. You are a field analyst with access to classified mission records.`,
      }],
    },
    tools,
  });

  const currentMissionContext = `
Current mission data:
- Difficulty: ${difficulty.toUpperCase()}
- Result: ${result.toUpperCase()}
- Time spent: ${timeSpent} seconds
- Tiles cleared: ${tilesCleared}
- AI advice used: ${aiAdviceCount} times

Write a strategic debrief based on the mission archives. Call query_mission_history first.
  `.trim();

  try {
    // ── Turn 1: initial call (expect function call back) ──────────
    console.log('[Debrief] Sending initial request to Vertex AI...');
    const result1 = await model.generateContent(currentMissionContext);
    const response1 = result1.response;

    if (!response1?.candidates?.length) {
      throw new Error('No candidates in initial Vertex AI response');
    }

    const parts1 = response1.candidates[0].content.parts;
    const funcCallPart = parts1.find(p => p.functionCall);

    let finalText;

    if (funcCallPart) {
      // ── Turn 2: execute tool → send result back ───────────────
      const { name, args } = funcCallPart.functionCall;
      console.log(`[Debrief] Vertex AI requested tool: ${name}`, args);

      const toolResult = await runQueryTool(args);
      console.log('[Debrief] Tool result length:', toolResult.length);

      const result2 = await model.generateContent({
        contents: [
          { role: 'user',  parts: [{ text: currentMissionContext }] },
          { role: 'model', parts: [funcCallPart] },
          {
            role: 'user',
            parts: [{
              functionResponse: { name, response: { content: toolResult } },
            }],
          },
        ],
      });

      const response2 = result2.response;
      if (!response2?.candidates?.length) {
        throw new Error('No candidates after tool call response');
      }

      finalText = response2.candidates[0].content.parts
        .filter(p => p.text)
        .map(p => p.text)
        .join('');
    } else {
      // Model answered directly without tool call
      finalText = parts1.filter(p => p.text).map(p => p.text).join('');
    }

    return finalText?.trim() || null;

  } catch (err) {
    const detail = {
      message:  err.message,
      code:     err.code,
      status:   err.status ?? err.statusCode,
      details:  err.details,
    };
    console.error('[Debrief] Vertex AI call FAILED:', JSON.stringify(detail, null, 2));
    return null; // Caller handles null gracefully with a fallback
  }
}

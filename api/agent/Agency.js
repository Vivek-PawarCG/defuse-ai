/**
 * Lightweight Agentic Framework for Defuse AI.
 * Replaces experimental @google/adk exports for production stability.
 */

export class Tool {
  constructor({ name, description, parameters }) {
    this.name = name;
    this.description = description;
    this.parameters = parameters;
  }

  async run() {
    throw new Error("Tool.run() not implemented");
  }
}

export class Agent {
  constructor({ name, description, instruction, model, apiKey, client }) {
    this.name = name;
    this.description = description;
    this.instruction = instruction;
    this.modelName = model;
    
    // Use the provided client or fallback (assuming GoogleGenerativeAI style)
    this.client = client; 
    this.tools = {};
  }

  addTool(tool) {
    this.tools[tool.name] = tool;
  }

  /**
   * Basic Agentic Reasoning loop.
   * Concatentates tool capability into the prompt to allow the LLM to 'choose' data.
   */
  async chat(prompt) {
    const toolDescriptions = Object.values(this.tools)
      .map(t => `TOOL: ${t.name}\nDESCRIPTION: ${t.description}\nPARAMS: ${JSON.stringify(t.parameters)}`)
      .join("\n\n");

    const fullPrompt = `
SYSTEM INSTRUCTION: ${this.instruction}

AVAILABLE ANALYTICAL TOOLS:
${toolDescriptions}

PLAYER QUERY: ${prompt}

RESPONSE GUIDELINE: Use the information from the tools to provide a strategic briefing.
`;
    
    // We'll use the model to generate the final briefing
    const modelInstance = this.client.getGenerativeModel({ model: this.modelName });
    const result = await modelInstance.generateContent({
      contents: [{ role: 'user', parts: [{ text: fullPrompt }] }]
    });

    // Handle Vertex AI SDK response structure
    const response = await result.response;
    return response.candidates[0].content.parts[0].text;
  }
}

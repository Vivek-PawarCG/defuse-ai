import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY missing from environment.' });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const { system_instruction, contents, generationConfig } = req.body;

    // Use default if not explicitly defined
    const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";

    // Extract the raw text from the REST-style system_instruction structure that the frontend sends
    const sysPromptText = system_instruction?.parts?.[0]?.text || system_instruction || "";

    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: sysPromptText
    });

    const result = await model.generateContent({
      contents: contents,
      generationConfig: generationConfig
    });

    res.status(200).json({ responseText: result.response.text() });
  } catch (error) {
    console.error("Gemini Error:", error);

    // Provide a diegetic error fallback for the game so it handles 500s gracefully
    res.status(200).json({
      responseText: "RADIO INTERFERENCE... Secure channel degraded. Repeat your last, soldier."
    });
  }
}

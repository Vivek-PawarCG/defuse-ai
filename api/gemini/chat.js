import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";
import { getCachedResponse, setCachedResponse } from "../utils/cache.js";

const ChatSchema = z.object({
  system_instruction: z.any().optional(),
  contents: z.array(
    z.object({
      role: z.enum(['user', 'model']),
      parts: z.array(z.object({ text: z.string() }))
    })
  ),
  generationConfig: z.any().optional()
});

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY missing from environment.' });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const parseResult = ChatSchema.safeParse(req.body);
    if (!parseResult.success) {
      console.warn("Invalid Payload Detected:", parseResult.error);
      return res.status(400).json({ error: "Invalid request payload format." });
    }

    const { system_instruction, contents, generationConfig } = parseResult.data;

    // ─── Cache Layer ───────────────────────────────────────
    const cacheKey = JSON.stringify(contents.slice(-1));
    const cached = getCachedResponse(cacheKey);
    if (cached) {
      return res.status(200).json({ responseText: cached, cached: true });
    }

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

    const responseText = result.response.text();
    setCachedResponse(cacheKey, responseText);

    res.status(200).json({ responseText });
  } catch (error) {
    console.error("Gemini Error:", error);
    res.status(error.status || 500).json({ error: error.message || "Uplink failure" });
  }
}

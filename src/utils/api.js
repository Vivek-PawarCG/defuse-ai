// ─── Gemini API (via backend proxy) ────────────────────────

export async function callGeminiAPI(systemInstruction, contents, generationConfig) {
  try {
    const res = await fetch('/api/gemini/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: {
          role: 'user',
          parts: [{ text: systemInstruction }],
        },
        contents,
        generationConfig: generationConfig || {
          temperature: 1.0,
          maxOutputTokens: 200,
        },
      }),
    });

    if (!res.ok) {
      throw new Error(`API ${res.status}`);
    }

    const data = await res.json();
    return data?.responseText || null;
  } catch (err) {
    console.error('Gemini API error:', err);
    return null;
  }
}

export async function checkHealth() {
  try {
    const res = await fetch('/api/health');
    return await res.json();
  } catch {
    return { status: 'error', hasKey: false };
  }
}

# DEFUSE — Reimagining a Classic

**DEFUSE** is a cinematic, narrative-driven bomb disposal simulator powered by Google Gemini.

## 🎯 Chosen Vertical
**Retro Childhood Game**
We took the iconic 1990s Windows puzzle game *Minesweeper* and reimagined it for 2026. Instead of clicking empty gray boxes in silence, players are guided by Colonel Rex, a dynamic, context-aware AI commander powered by the Gemini AI. We didn't clone the game; we evolved it into an immersive, high-stakes narrative experience.

## 🧠 Approach and Logic
Our approach was to physically separate the core mathematical engine (calculating adjacent mines and recursive flood-fills) from the user interface. By isolating the game state, we could perfectly parse player telemetry on every single click. 

Instead of pre-written generic dialogue, we feed this exact gameplay telemetry (e.g., "The player clicked a safe tile, but there are 4 adjacent mines") directly into the `google's generative ai` SDK. Gemini then acts as a live "Field Commander," dynamically generating spoken tactical advice or panicked warnings based on the real-time mathematical danger.

## ⚙️ How the Solution Works
1. **Frontend Interface**: A responsive, 100% ARIA-accessible React app running on Vite. It includes the complete visual overhaul into a CRTs/military terminal aesthetic.
2. **Serverless AI Backend**: To protect API keys, we built a hybrid Node.js mapping structure. A dedicated handler (`api/gemini/chat.js`) acts as a secure proxy to the Gemini endpoints. This architecture is capable of running as a monolith on **Google Cloud Run** or as pure serverless functions natively on **Vercel**.
3. **The Lifeline System**: Players can use an "Emergency Radio" to ask Gemini for intel on an unrevealed tile. Gemini is fed the *actual truth* (mine or safe) and roleplays confident advice or "compromised signal interference."
4. **Native Text-to-Speech**: We hooked Gemini's generated dialogue directly into the browser's native Web Speech API, meaning every custom piece of advice from Colonel Rex is spoken aloud immediately, keeping the web-bundle tiny.

## 🤔 Assumptions Made
* **Basic Ruleset Knowledge**: We assume players know the fundamental rules of Minesweeper (numbers represent the count of directly adjacent active mines). However, we mitigated a lack of rules knowledge by adding an interactive "Field Manual" button.
* **Stable Connection**: We assume the player has a stable internet connection capable of resolving Gemini API payloads in < 2 seconds for smooth commentary. If the connection fails, the app has a built-in fallback array of hardcoded tactical phrases so the game never crashes.
* **Modern Browser**: We assume the player is using a modern browser (Chrome, Safari, Firefox, Edge) capable of processing Web Audio and Speech Synthesis APIs to fully experience the dynamic Colonel Rex voice acting.

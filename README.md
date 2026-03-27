# DEFUSE — Reimagining Minesweeper with Gemini

**We turned the 90s puzzle into a cinematic bomb disposal simulator where Gemini AI acts as a live "Field Commander."**

## 🧠 AI as a Dynamic Metagame
Guided by **Colonel Rex** (powered by Google's Generative AI), Gemini analyzes exact gameplay telemetry—tile coordinates and adjacent mines—to generate spoken tactical advice or panicked warnings on the fly. 

## ⚙️ Optimization & Resilience
*   **Lifelines**: Ask Gemini to analyze an unrevealed tile, risking accurate intel or "signal interference."
*   **Fail-Safe**: If API limits hit, the game instantly falls back to local dialogue algorithms. We utilized the native **Web Speech API** for voice generation, keeping the bundle tiny and fast.

## 🚀 Google Cloud Ecosystem
*   **Google Cloud Run**: Serverless Node.js backend serving both the UI and secure ML APIs from a single scalable origin.
*   **Firebase Firestore**: Powering the global "Hall of Fame" leaderboard with real-time score synchronization.
*   **Google Cloud Logging**: Integrated system observability for real-time monitoring of AI responses and tactical telemetry.

*The mines are buried, but with Gemini, defusing them is infinitely cinematic.* 💣🚁

---


## ⚙️ How the Solution Works
1. **Frontend Interface**: A responsive, 100% ARIA-accessible React app running on Vite. It includes the complete visual overhaul into a CRTs/military terminal aesthetic.
2. **Serverless AI Backend**: To protect API keys, we built a hybrid Node.js mapping structure. A dedicated handler (`api/gemini/chat.js`) acts as a secure proxy to the Gemini endpoints. This architecture is capable of running as a monolith on **Google Cloud Run** or as pure serverless functions natively on **Vercel**.
3. **The Lifeline System**: Players can use an "Emergency Radio" to ask Gemini for intel on an unrevealed tile. Gemini is fed the *actual truth* (mine or safe) and roleplays confident advice or "compromised signal interference."
4. **Native Text-to-Speech**: We hooked Gemini's generated dialogue directly into the browser's native Web Speech API, meaning every custom piece of advice from Colonel Rex is spoken aloud immediately, keeping the web-bundle tiny.

## 🤔 Assumptions Made
* **Basic Ruleset Knowledge**: We assume players know the fundamental rules of Minesweeper (numbers represent the count of directly adjacent active mines). However, we mitigated a lack of rules knowledge by adding an interactive "Field Manual" button.
* **Stable Connection**: We assume the player has a stable internet connection capable of resolving Gemini API payloads in < 2 seconds for smooth commentary. If the connection fails, the app has a built-in fallback array of hardcoded tactical phrases so the game never crashes.
* **Modern Browser**: We assume the player is using a modern browser (Chrome, Safari, Firefox, Edge) capable of processing Web Audio and Speech Synthesis APIs to fully experience the dynamic Colonel Rex voice acting.

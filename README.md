# DEFUSE — AI Bomb Disposal Expert

**BOMB DISPOSAL TRAINING — FIELD EXERCISE 7**

DEFUSE is a high-stakes, military-themed Minesweeper game enhanced with AI intelligence. Face the field with **Colonel Rex**, your AI Bomb Disposal Expert, who provides real-time tactical advice, insults, or encouragement as you clear the minefield.

---

## 🚀 Key Features

- **🤖 AI Intelligence (Colonel Rex)**: Powered by Google Gemini, Col. Rex monitors your every move. Choose between "Drill Sergeant", "Mentor", or "Comedian" personalities.
- **🔦 Tactical Heatmap**: Toggle a probability heatmap to visualize the risk level of every hidden tile.
- **⚡ AI Auto-Solver**: Feeling stuck? Let the AI analyze the board and make the next logical move for you.
- **📡 Emergency Radio**: A one-time use lifeline to ask Col. Rex for intel on a specific coordinate (e.g., "B4").
- **🎖️ Difficulty Ranks**: From **Rookie** (8x8) to **Legend** (30x16), test your skills across five intense ranks.
- **📖 Field Manual**: Built-in guide covering advanced tactical patterns like the 1-2-1 and 1-2-2-1 logic.
- **🔊 Tactical Audio**: Immersive military soundscapes and voice-enabled commentary (optional).

## 🕹️ Game Walkthrough

### 1. Mission Briefing
When you first enter the field, you'll be met with a secure transmission from **Colonel Rex**. This is your briefing. Read the mission details carefully before clicking **"ENTER THE FIELD"**.

### 2. Tactical Analysis
Once on the grid, use the numbers to deduce mine locations.
- **Left-Click** to reveal a tile.
- **Right-Click** to flag a suspected mine.
- **Heatmap (🌡 HEAT)**: If you're unsure, toggle the heatmap. Brighter colors indicate a higher probability of a mine based on surrounding numbers.

### 3. AI Assistance
Don't go it alone if the pressure is too high:
- **Radio Intel**: Type a coordinate (like `B4`) into the Emergency Radio to get direct intel from Rex.
- **Auto-Solver**: Click the **🤖 SOLVE** button to have the AI perform the next logical step.

### 4. Extraction
Clear all non-mine tiles to successfully complete the mission. If you hit a mine, the board will reveal all locations, and Rex will provide an **After Action Report** (often with a bit of "constructive" criticism).

---

## 🎮 How to Play

1.  **Objective**: Reveal all safe tiles without detonating a single mine.
2.  **Controls**:
    - **Left Click**: Reveal a tile.
    - **Right Click / Long Press**: Flag a suspected mine.
    - **Number Tiles**: Indicate how many mines are in the 8 adjacent squares.
3.  **Victory**: Clear the entire field to earn your stripes.

## 🛠️ Technical Stack

- **Frontend**: HTML5, Vanilla CSS3 (Glassmorphism, Animations).
- **Logic**: Pure JavaScript (ES6+).
- **AI**: Google Gemini API Integration.
- **Typography**: OSWALD & Share Tech Mono (via Google Fonts).

## ⚙️ Setup & Configuration

### Local Execution
1.  Clone the repository:
    ```bash
    git clone https://github.com/aniketdongale09/minesweeper.git
    ```
2.  Open `index.html` in any modern web browser.

### API Key (Required for AI Features)
To enable Colonel Rex's commentary:
1.  Click the **Settings (⚙️)** icon in the top right.
2.  Enter your **Gemini API Key**.
3.  Your key is stored securely in your browser's `localStorage` and is never sent to any server other than Google's API.

---

*Good luck out there, soldier. Don't let the pressure get to you.*

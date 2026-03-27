import React, { useState, useCallback, useRef, useEffect } from 'react';
import { DIFFICULTIES, PERSONALITY_GREETINGS } from './utils/constants.js';
import {
  createEmptyBoard, initBoard, revealTileOnBoard, toggleFlagOnBoard,
  revealAllTiles, computeProbabilityMap, findMissedFlags,
  tileCoordToLabel, classifyClick, getPlayerStyleSummary,
  findDeterministicMove, findRandomGuess, formatTime, labelToCoord,
} from './utils/gameLogic.js';
import { checkHealth } from './utils/api.js';
import { useTimer } from './hooks/useTimer.js';
import { useAudio } from './hooks/useAudio.js';
import { useRex } from './hooks/useRex.js';
import VictoryOverlay from './components/VictoryOverlay.jsx';
import FieldManual from './components/FieldManual.jsx';
import CommandCenter from './components/CommandCenter.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import BriefingScreen from './components/BriefingScreen.jsx';
import GameScreen from './components/GameScreen.jsx';

const INITIAL_DIFFICULTY = 'rookie';

const SCREENS = {
  BRIEFING: 'briefing',
  GAME: 'game',
  COMMAND_CENTER: 'command-center'
};

export default function App() {
  // ─── Screen state ────────────────────────────────────────
  const [screen, setScreen] = useState(SCREENS.BRIEFING); // 'briefing' | 'game' | 'command-center'

  // ─── Game state ──────────────────────────────────────────
  const [difficulty, setDifficulty] = useState(INITIAL_DIFFICULTY);
  const config = DIFFICULTIES[difficulty];
  const [board, setBoard] = useState(() => createEmptyBoard(config.rows, config.cols));
  const [minesRemaining, setMinesRemaining] = useState(config.mines);
  const [tilesRevealed, setTilesRevealed] = useState(0);
  const [flagsUsed, setFlagsUsed] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [firstClick, setFirstClick] = useState(true);
  const [personality, setPersonality] = useState('drill-sergeant');
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [heatmapEnabled, setHeatmapEnabled] = useState(false);
  const [heatmapData, setHeatmapData] = useState(null);
  const [autoSolving, setAutoSolving] = useState(false);
  const [lifelineUsed, setLifelineUsed] = useState(false);
  const [missedFlags, setMissedFlags] = useState(null);
  const [showGameOver, setShowGameOver] = useState(false);
  const [showVictory, setShowVictory] = useState(false);
  const [gameOverTitle, setGameOverTitle] = useState('MISSION FAILED');
  const [gameOverEulogy, setGameOverEulogy] = useState('');
  const [gameOverStats, setGameOverStats] = useState('');
  const [victorySpeech, setVictorySpeech] = useState('');
  const [victoryTitle, setVictoryTitle] = useState('');
  const [victoryStats, setVictoryStats] = useState('');
  const [shakeClass, setShakeClass] = useState('');
  const [apiReady, setApiReady] = useState(false);

  // ─── Refs for mutable state (avoid stale closures) ──────
  const moveHistoryRef = useRef([]);
  const clickPatternsRef = useRef({ corners: 0, edges: 0, center: 0, totalClicks: 0, timings: [], lastClickTime: null });
  const autoSolvingRef = useRef(false);
  const gameOverRef = useRef(false);
  const boardRef = useRef(board);
  const tilesRevealedRef = useRef(0);
  const firstClickRef = useRef(true);
  const minesRemainingRef = useRef(config.mines);
  const aiAdviceCountRef = useRef(0); // Added this ref for archiveMission

  /**
   * Archive mission data to BigQuery via the backend proxy.
   */
  const archiveMission = useCallback(async (result) => {
    try {
      await fetch('/api/archive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          difficulty,
          result,
          timeSpent: timer.time,
          tilesCleared: tilesRevealedRef.current,
          aiAdviceCount: aiAdviceCountRef.current || 0
        })
      });
    } catch (err) {
      console.error("Failed to archive mission", err);
    }
  }, [difficulty, timer.time]);

  // Keep refs in sync
  useEffect(() => { boardRef.current = board; }, [board]);
  useEffect(() => { tilesRevealedRef.current = tilesRevealed; }, [tilesRevealed]);
  useEffect(() => { firstClickRef.current = firstClick; }, [firstClick]);
  useEffect(() => { gameOverRef.current = gameOver; }, [gameOver]);
  useEffect(() => { autoSolvingRef.current = autoSolving; }, [autoSolving]);
  useEffect(() => { minesRemainingRef.current = minesRemaining; }, [minesRemaining]);

  const totalSafeTiles = config.rows * config.cols - config.mines;

  // ─── Hooks ───────────────────────────────────────────────
  const timer = useTimer();
  const audio = useAudio();
  const rex = useRex();

  // ─── Check API health on mount ───────────────────────────
  useEffect(() => {
    checkHealth().then(h => setApiReady(h.hasKey));
  }, []);

  // ─── Load voices ────────────────────────────────────────
  useEffect(() => {
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = audio.loadVoices;
    }
  }, [audio.loadVoices]);

  // ─── Reset Game ──────────────────────────────────────────
  const resetGame = useCallback((newDifficulty) => {
    const diff = newDifficulty || difficulty;
    const cfg = DIFFICULTIES[diff];
    timer.reset();
    setDifficulty(diff);
    setBoard(createEmptyBoard(cfg.rows, cfg.cols));
    setMinesRemaining(cfg.mines);
    setTilesRevealed(0);
    setFlagsUsed(0);
    setGameStarted(false);
    setGameOver(false);
    setFirstClick(true);
    setLifelineUsed(false);
    setHeatmapEnabled(false);
    setHeatmapData(null);
    setMissedFlags(null);
    setAutoSolving(false);
    setShowGameOver(false);
    setShowVictory(false);
    setGameOverEulogy('');
    setVictorySpeech('');
    setVictoryTitle('');
    setShakeClass('');
    moveHistoryRef.current = [];
    clickPatternsRef.current = { corners: 0, edges: 0, center: 0, totalClicks: 0, timings: [], lastClickTime: null };
    autoSolvingRef.current = false;
    gameOverRef.current = false;
    firstClickRef.current = true;
    tilesRevealedRef.current = 0;
    minesRemainingRef.current = cfg.mines;
    aiAdviceCountRef.current = 0; // Reset AI advice count

    trackEvent('mission_start', { difficulty });
  }, [difficulty, timer]);

  // ─── Handle Victory ─────────────────────────────────────
  const handleVictory = useCallback(async (currentBoard) => {
    setGameOver(true);
    gameOverRef.current = true;
    timer.stop();
    audio.playSound('victory');

    const timeVal = timer.time;
    const flagsVal = flagsUsed;
    setVictoryStats(`TIME: ${formatTime(timeVal)} | TILES CLEARED: ${totalSafeTiles} | FLAGS USED: ${flagsVal}`);

    setShowVictory(true);

    const styleSummary = getPlayerStyleSummary(clickPatternsRef.current);
    const prompt = JSON.stringify({ action: 'victory', tilesCleared: totalSafeTiles, timeElapsed: timeVal, flagsUsed: flagsVal });

    const speech = await rex.callRex(
      `Soldier has cleared the entire minefield! Give an emotional 4 sentence celebration. Award the soldier a legendary field title (something creative and epic, like "The Ghost Walker" or "Iron Nerve").${styleSummary ? ' Weave in this observation about their style: ' + styleSummary : ''} End your message with "Field Title Awarded: [TITLE]" on its own line. Context: ${prompt}`,
      personality,
    );

    const speechText = speech || "You magnificent rookie. You walked through hell and came out the other side with all your limbs. Not many can say that. From this day forward, you carry the name of a legend.";

    let mainSpeech = speechText;
    let title = 'THE PHANTOM SWEEPER';
    const titleMatch = speechText.match(/Field Title Awarded:\s*(.+)/i);
    if (titleMatch) {
      title = titleMatch[1].trim().replace(/[*"]/g, '');
      mainSpeech = speechText.replace(/Field Title Awarded:\s*.+/i, '').trim();
    }

    setVictorySpeech(mainSpeech);
    setVictoryTitle(`★ ${title} ★`);
    audio.speakRex(mainSpeech, personality, true);

    trackEvent('mission_success', { difficulty, time: timeVal, score: totalSafeTiles });
    archiveMission('success');
  }, [timer, audio, rex, personality, totalSafeTiles, flagsUsed, archiveMission]);

  // ─── Handle Explosion ───────────────────────────────────
  const handleExplosion = useCallback(async (r, c, isSurrender = false, currentBoard) => {
    setGameOver(true);
    gameOverRef.current = true;
    timer.stop();
    setAutoSolving(false);
    autoSolvingRef.current = false;

    let brd = currentBoard || boardRef.current;

    if (firstClickRef.current && isSurrender) {
      brd = initBoard(config.rows, config.cols, config.mines, Math.floor(config.rows / 2), Math.floor(config.cols / 2));
      setFirstClick(false);
    }

    audio.playSound('explosion');

    const missed = !isSurrender ? findMissedFlags(brd, config.rows, config.cols) : new Set();
    setMissedFlags(missed);

    const revealedBoard = revealAllTiles(brd);
    setBoard(revealedBoard);
    boardRef.current = revealedBoard;

    setShakeClass('shake-hard');
    setTimeout(() => setShakeClass(''), 600);

    const timeVal = timer.time;
    setGameOverTitle(isSurrender ? 'MISSION ABORTED' : 'MISSION FAILED');
    setGameOverStats(`TIME SURVIVED: ${formatTime(timeVal)} | TILES CLEARED: ${tilesRevealedRef.current} | MINES REMAINING: ${minesRemainingRef.current}`);

    setTimeout(() => setShowGameOver(true), 800);

    const moveLog = moveHistoryRef.current.join(' -> ');
    const styleSummary = getPlayerStyleSummary(clickPatternsRef.current);
    const missedList = missed.size > 0
      ? [...missed].map(k => { const [mr, mc] = k.split(',').map(Number); return tileCoordToLabel(mr, mc); }).join(', ')
      : null;

    const gameOverPrompt = isSurrender
      ? `The rookie surrendered and gave up. Give a ${personality === 'comedian' ? 'sarcastically funny' : personality === 'mentor' ? 'understanding but disappointed' : 'harsh and disgusted'} 2-sentence tactical commentary.${styleSummary ? ' Player style context: ' + styleSummary : ''} End with "MISSION ABORTED".`
      : `The rookie just triggered a mine and died. The mission failed.\nHere are their last few moves: ${moveLog}.\n${missedList ? `IMPORTANT: The soldier could have logically deduced that tile(s) [${missedList}] were mines BEFORE clicking. Mention this specifically.` : ''}\n${styleSummary ? `Player style context: ${styleSummary}` : ''}\nBased on Minesweeper logic, brutally point out their fatal mistake or logical error.\nGive a dramatic, ${personality === 'comedian' ? 'sarcastically funny' : 'harsh'} tactical analysis.\nEnd with "MISSION FAILED". Max 4 sentences.`;

    const eulogy = await rex.callRex(gameOverPrompt, personality);
    const eulogyText = eulogy || (isSurrender
      ? "Retreating from the field. Some battles aren't meant to be won today."
      : "That rookie had guts. More guts than brains, but guts nonetheless. The field claims another.");

    setGameOverEulogy(eulogyText);
    audio.speakRex(eulogyText, personality, true);

    trackEvent('mission_failed', { difficulty, time: timeVal, result: isSurrender ? 'surrender' : 'explosion' });
    archiveMission(isSurrender ? 'surrender' : 'fail');
  }, [timer, audio, rex, personality, config, archiveMission]);

  // ─── Reveal Tile ─────────────────────────────────────────
  const revealTile = useCallback((r, c) => {
    if (gameOverRef.current) return;

    let currentBoard = boardRef.current;

    // First click — generate board
    if (firstClickRef.current) {
      currentBoard = initBoard(config.rows, config.cols, config.mines, r, c);
      setBoard(currentBoard);
      boardRef.current = currentBoard;
      setFirstClick(false);
      firstClickRef.current = false;
      setGameStarted(true);
      timer.start();
    }

    const cell = currentBoard[r][c];
    if (cell.revealed || cell.flagged) return;

    // Track click patterns
    const now = Date.now();
    const cp = clickPatternsRef.current;
    if (cp.lastClickTime) {
      cp.timings.push((now - cp.lastClickTime) / 1000);
    }
    cp.lastClickTime = now;
    const zone = classifyClick(r, c, config.rows, config.cols);
    cp[zone]++;
    cp.totalClicks++;

    if (cell.mine) {
      handleExplosion(r, c, false, currentBoard);
      return;
    }

    const result = revealTileOnBoard(currentBoard, config.rows, config.cols, r, c);
    setBoard(result.board);
    boardRef.current = result.board;

    const newTotal = tilesRevealedRef.current + result.tilesRevealed;
    setTilesRevealed(newTotal);
    tilesRevealedRef.current = newTotal;

    const label = tileCoordToLabel(r, c);
    moveHistoryRef.current.push(`Revealed ${label} (${cell.adjacentMines} adjacent mines)`);
    if (moveHistoryRef.current.length > 15) moveHistoryRef.current.shift();

    audio.playSound('click');

    // Screen shake for high danger
    if (cell.adjacentMines >= 3) {
      setShakeClass('shake-mild');
      setTimeout(() => setShakeClass(''), 300);
    }

    // Update heatmap if active
    if (heatmapEnabled) {
      setHeatmapData(computeProbabilityMap(result.board, config.rows, config.cols, config.mines));
    }

    // Check win
    if (newTotal === totalSafeTiles) {
      handleVictory(result.board);
      return;
    }

    // Rex commentary (skip during auto-solve)
    if (!autoSolvingRef.current) {
      let rexHint = '';
      if (cell.adjacentMines === 0) {
        rexHint = 'The area is clear (0 adjacent mines). Respond with calm relief but tell soldier to stay alert.';
      } else if (cell.adjacentMines <= 2) {
        rexHint = `There are ${cell.adjacentMines} mine(s) nearby. Respond with caution, mention nearby danger.`;
      } else {
        rexHint = `HOT ZONE! ${cell.adjacentMines} adjacent mines! Respond with high tension and hot zone warning.`;
      }

      const prompt = JSON.stringify({
        action: 'safe_click', tile: label, adjacentMines: cell.adjacentMines,
        minesRemaining: minesRemainingRef.current, tilesLeft: totalSafeTiles - newTotal, timeElapsed: timer.time,
      });

      rex.callRex(
        `Soldier just revealed tile ${label}. ${rexHint} Context: ${prompt}`,
        personality,
      ).then(response => {
        if (response) {
          rex.addMessage(response, prompt);
          audio.speakRex(response, personality, voiceEnabled);
        } else {
          const fallback = cell.adjacentMines === 0
            ? "Clear sector. Move forward, soldier."
            : cell.adjacentMines <= 2
              ? `${cell.adjacentMines} contact${cell.adjacentMines > 1 ? 's' : ''} nearby. Watch your step.`
              : `Hot zone! ${cell.adjacentMines} devices detected. Do NOT rush this.`;
          rex.addMessage(fallback, prompt);
        }
      });
    }
  }, [config, timer, audio, rex, personality, voiceEnabled, heatmapEnabled, totalSafeTiles, handleExplosion, handleVictory]);

  // ─── Flag Tile ───────────────────────────────────────────
  const flagTile = useCallback((r, c) => {
    if (gameOverRef.current || firstClickRef.current) return;
    const currentBoard = boardRef.current;
    const cell = currentBoard[r][c];
    if (cell.revealed) return;

    const result = toggleFlagOnBoard(currentBoard, r, c);
    setBoard(result.board);
    boardRef.current = result.board;

    setMinesRemaining(prev => {
      const newVal = prev - result.delta;
      minesRemainingRef.current = newVal;
      return newVal;
    });
    setFlagsUsed(prev => prev + result.delta);

    const label = tileCoordToLabel(r, c);
    moveHistoryRef.current.push(result.delta > 0 ? `Flagged ${label}` : `Removed flag from ${label}`);
    if (moveHistoryRef.current.length > 15) moveHistoryRef.current.shift();

    audio.playSound('flag');

    if (heatmapEnabled) {
      setHeatmapData(computeProbabilityMap(result.board, config.rows, config.cols, config.mines));
    }
  }, [config, audio, heatmapEnabled]);

  // ─── Heatmap Toggle ─────────────────────────────────────
  const toggleHeatmap = useCallback(() => {
    if (gameOverRef.current) return;
    setHeatmapEnabled(prev => {
      const next = !prev;
      if (next) {
        setHeatmapData(computeProbabilityMap(boardRef.current, config.rows, config.cols, config.mines));
      } else {
        setHeatmapData(null);
      }
      return next;
    });
  }, [config]);

  // ─── Auto-Solver ────────────────────────────────────────
  const startAutoSolve = useCallback(async () => {
    if (gameOverRef.current || autoSolvingRef.current) return;
    setAutoSolving(true);
    autoSolvingRef.current = true;

    const solverMessages = {
      'comedian': "Fine, let the computer do the dangerous work. Step back.",
      'mentor': "Activating Auto-Solve. Watch and learn these tactical patterns.",
      'drill-sergeant': "AUTO-SOLVE ENGAGED. Listen and learn, rookie.",
    };
    rex.addMessage(solverMessages[personality] || solverMessages['drill-sergeant'], 'Auto-Solve');

    const solveLoop = async () => {
      while (autoSolvingRef.current && !gameOverRef.current) {
        await new Promise(r => setTimeout(r, 600));
        if (gameOverRef.current || !autoSolvingRef.current) break;

        // First click
        if (firstClickRef.current) {
          const r = Math.floor(config.rows / 2);
          const c = Math.floor(config.cols / 2);
          rex.addMessage(`Step 1 (First Move): Initiating central breach at ${tileCoordToLabel(r, c)}.`, 'Auto-Solve');
          revealTile(r, c);
          continue;
        }

        const move = findDeterministicMove(boardRef.current, config.rows, config.cols);
        if (move) {
          rex.addMessage(move.message, 'Tactics');
          if (move.type === 'flag') {
            flagTile(move.r, move.c);
          } else {
            revealTile(move.r, move.c);
          }
        } else {
          const guess = findRandomGuess(boardRef.current, config.rows, config.cols);
          if (guess) {
            rex.addMessage(guess.message, 'Guessing');
            revealTile(guess.r, guess.c);
          } else {
            break;
          }
        }
      }
      setAutoSolving(false);
      autoSolvingRef.current = false;
    };

    solveLoop();
  }, [config, personality, rex, revealTile, flagTile]);

  // ─── Lifeline ───────────────────────────────────────────
  const sendLifeline = useCallback(async (input) => {
    const coord = labelToCoord(input, config.rows, config.cols);
    if (!coord) return false;

    setLifelineUsed(true);

    const currentBoard = boardRef.current;
    const cell = currentBoard[coord.row][coord.col];
    const isMine = cell.mine;
    const label = tileCoordToLabel(coord.row, coord.col);

    const compromised = Math.random() < 0.2;

    let intelInfo;
    if (compromised) {
      intelInfo = `Soldier asked about tile ${label}. Your intel is compromised — signal interference! Give uncertain advice. Include the line "Intel confidence: LOW" and mention the signal is degraded.`;
    } else if (isMine) {
      intelInfo = `Soldier asked about tile ${label}. That tile IS a mine. Warn them strongly to stay away. Include the line "Intel confidence: HIGH"`;
    } else {
      const adjCount = cell.adjacentMines;
      intelInfo = `Soldier asked about tile ${label}. That tile is safe (${adjCount} adjacent mines). Give cautious green light. Include the line "Intel confidence: ${adjCount >= 3 ? 'MEDIUM' : 'HIGH'}"`;
    }

    const response = await rex.callRex(
      `LIFELINE REQUEST. ${intelInfo}. Respond in character, 2-3 sentences max.`,
      personality,
    );

    const fallback = compromised
      ? `Signal's spotty. Can't confirm ${label}, soldier. Intel confidence: LOW`
      : isMine
        ? `Stay away from ${label}, soldier. My instruments are screaming. Intel confidence: HIGH`
        : `${label} reads clean on my scope. Proceed with caution. Intel confidence: HIGH`;

    rex.addMessage(response || fallback, 'LIFELINE: ' + label);
    audio.speakRex(response || fallback, personality, voiceEnabled);
    return true;
  }, [config, rex, personality, audio, voiceEnabled]);

  // ─── Personality Switch ─────────────────────────────────
  const switchPersonality = useCallback((newPersonality) => {
    setPersonality(newPersonality);
    rex.addMessage(PERSONALITY_GREETINGS[newPersonality], 'Personality Switched');
    audio.speakRex(PERSONALITY_GREETINGS[newPersonality], newPersonality, voiceEnabled);
  }, [rex, audio, voiceEnabled]);

  // ─── Difficulty Switch ──────────────────────────────────
  const switchDifficulty = useCallback((newDifficulty) => {
    if (newDifficulty === difficulty && gameStarted) return;
    resetGame(newDifficulty);
  }, [difficulty, gameStarted, resetGame]);

  // ─── Voice Toggle ───────────────────────────────────────
  const toggleVoice = useCallback(() => {
    setVoiceEnabled(prev => {
      const next = !prev;
      if (next) {
        audio.loadVoices();
        rex.addMessage("Radio voice comms activated.", "System");
      } else {
        speechSynthesis.cancel();
        rex.addMessage("Voice comms silenced. Text only.", "System");
      }
      return next;
    });
  }, [audio, rex]);

  // ─── Surrender / New Game ───────────────────────────────
  const handleSurrender = useCallback(() => {
    if (gameOver) {
      // New Game mode
      rex.clearMessages();
      resetGame();
      rex.addMessage("Back on your feet, soldier. This minefield won't clear itself.", "Retry");
      return;
    }
    handleExplosion(0, 0, true, boardRef.current);
  }, [gameOver, rex, resetGame, handleExplosion]);

  // ─── Enter Field (from briefing) ────────────────────────
  const enterField = useCallback(() => {
    setScreen(SCREENS.GAME);
    resetGame();
    rex.addMessage("Channel open. I'm here with you, soldier. Take your first step.", "Game started");
  }, [resetGame, rex]);

  // ─── Return to Base ─────────────────────────────────────
  const returnToBase = useCallback(() => {
    rex.clearMessages();
    setScreen(SCREENS.BRIEFING);
  }, [rex]);

  // ─── Retry ──────────────────────────────────────────────
  const retry = useCallback(() => {
    rex.clearMessages();
    resetGame();
    rex.addMessage("Back on your feet, soldier. This minefield won't clear itself.", "Retry");
  }, [rex, resetGame]);

  // ─── Next Mission ───────────────────────────────────────
  const nextMission = useCallback(() => {
    rex.clearMessages();
    resetGame();
    rex.addMessage("New field, same rules. Show me what you've learned, soldier.", "Next mission");
  }, [rex, resetGame]);

  // ─── Dismiss overlays ───────────────────────────────────
  const dismissGameOver = useCallback(() => setShowGameOver(false), []);
  const dismissVictory = useCallback(() => setShowVictory(false), []);

  const renderScreen = () => {
    switch (screen) {
      case SCREENS.BRIEFING:
        return (
          <BriefingScreen
            onEnterField={enterField}
            apiReady={apiReady}
            personality={personality}
            speakRex={audio.speakRex}
            onOpenCommandCenter={() => setScreen(SCREENS.COMMAND_CENTER)}
          />
        );
      case SCREENS.GAME:
        return (
          <GameScreen
            // Game state
            board={board}
            rows={config.rows}
            cols={config.cols}
            difficulty={difficulty}
            minesRemaining={minesRemaining}
            tilesRevealed={tilesRevealed}
            totalSafeTiles={totalSafeTiles}
            time={timer.time}
            gameOver={gameOver}
            firstClick={firstClick}
            personality={personality}
            voiceEnabled={voiceEnabled}
            heatmapEnabled={heatmapEnabled}
            heatmapData={heatmapData}
            autoSolving={autoSolving}
            lifelineUsed={lifelineUsed}
            missedFlags={missedFlags}
            shakeClass={shakeClass}
            // Overlays
            showGameOver={showGameOver}
            gameOverTitle={gameOverTitle}
            gameOverEulogy={gameOverEulogy}
            gameOverStats={gameOverStats}
            showVictory={showVictory}
            victorySpeech={victorySpeech}
            victoryTitle={victoryTitle}
            victoryStats={victoryStats}
            // Rex
            rexMessages={rex.messages}
            rexLoading={rex.loading}
            // Actions
            onRevealTile={revealTile}
            onFlagTile={flagTile}
            onSwitchDifficulty={switchDifficulty}
            onSwitchPersonality={switchPersonality}
            onToggleVoice={toggleVoice}
            onToggleHeatmap={toggleHeatmap}
            onAutoSolve={startAutoSolve}
            onSurrender={handleSurrender}
            onSendLifeline={sendLifeline}
            onRetry={retry}
            onReviewBoard={dismissGameOver}
            onReturnToBase={returnToBase}
            onNextMission={nextMission}
            onDismissVictory={dismissVictory}
          />
        );
      case SCREENS.COMMAND_CENTER:
        return (
          <CommandCenter
            onReturnToMenu={() => setScreen(SCREENS.BRIEFING)}
          />
        );
      default:
        return null;
    }
  };

  // ─── Render ──────────────────────────────────────────────
  return (
    <ErrorBoundary>
      <div className="app-container">
        {renderScreen()}
      </div>
    </ErrorBoundary>
  );
}

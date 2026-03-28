import React, { useState } from 'react';
import { TILE_SIZE_MAP } from '../utils/constants.js';
import TopBar from './TopBar.jsx';
import MinesweeperGrid from './MinesweeperGrid.jsx';
import RexPanel from './RexPanel.jsx';
import GameOverOverlay from './GameOverOverlay.jsx';
import VictoryOverlay from './VictoryOverlay.jsx';
import LeaderboardOverlay from './LeaderboardOverlay.jsx';

export default function GameScreen({
  board, rows, cols, difficulty, minesRemaining, tilesRevealed, totalSafeTiles,
  time, gameOver, firstClick, personality, voiceEnabled, heatmapEnabled, heatmapData,
  autoSolving, lifelineUsed, missedFlags, shakeClass,
  showGameOver, gameOverTitle, gameOverEulogy, gameOverStats, strategicDebrief,
  showVictory, victorySpeech, victoryTitle, victoryStats,
  rexMessages, rexLoading,
  onRevealTile, onFlagTile, onSwitchDifficulty, onSwitchPersonality,
  onToggleVoice, onToggleHeatmap, onAutoSolve, onSurrender,
  onSendLifeline, onRetry, onReviewBoard, onReturnToBase,
  onNextMission, onDismissVictory, aiEnabled, onToggleAi,
}) {
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  return (
    <div id="game-screen" className={`screen active ${shakeClass}`}>
      <div className="scanline-overlay"></div>

      <TopBar
        minesRemaining={minesRemaining}
        time={time}
        difficulty={difficulty}
        personality={personality}
        voiceEnabled={voiceEnabled}
        heatmapEnabled={heatmapEnabled}
        gameOver={gameOver}
        onSwitchDifficulty={onSwitchDifficulty}
        onSwitchPersonality={onSwitchPersonality}
        onToggleVoice={onToggleVoice}
        onToggleHeatmap={onToggleHeatmap}
        onAutoSolve={onAutoSolve}
        onSurrender={onSurrender}
        onShowLeaderboard={() => setShowLeaderboard(true)}
      />

      <main id="game-main">
        <section id="grid-panel">
          <MinesweeperGrid
            board={board}
            rows={rows}
            cols={cols}
            difficulty={difficulty}
            heatmapEnabled={heatmapEnabled}
            heatmapData={heatmapData}
            gameOver={gameOver}
            missedFlags={missedFlags}
            onRevealTile={onRevealTile}
            onFlagTile={onFlagTile}
          />
        </section>

        <RexPanel
          messages={rexMessages}
          loading={rexLoading}
          lifelineUsed={lifelineUsed}
          gameOver={gameOver}
          aiEnabled={aiEnabled}
          onSendLifeline={onSendLifeline}
          onToggleAi={onToggleAi}
        />

        {showGameOver && (
          <GameOverOverlay
            title={gameOverTitle}
            eulogy={gameOverEulogy}
            stats={gameOverStats}
            strategicDebrief={strategicDebrief}
            onRetry={onRetry}
            onReviewBoard={onReviewBoard}
            onReturnToBase={onReturnToBase}
          />
        )}

        {showVictory && (
          <VictoryOverlay
            speech={victorySpeech}
            title={victoryTitle}
            stats={victoryStats}
            strategicDebrief={strategicDebrief}
            score={tilesRevealed}
            time={time}
            difficulty={difficulty}
            onNextMission={onNextMission}
            onReviewBoard={onDismissVictory}
          />
        )}

        {showLeaderboard && (
          <LeaderboardOverlay
            difficulty={difficulty}
            onClose={() => setShowLeaderboard(false)}
          />
        )}
      </main>
    </div>
  );
}

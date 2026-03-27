import React, { useRef, useCallback } from 'react';
import { TILE_SIZE_MAP } from '../utils/constants.js';
import { colToLetter, tileCoordToLabel } from '../utils/gameLogic.js';

export default function MinesweeperGrid({
  board, rows, cols, difficulty, heatmapEnabled, heatmapData,
  gameOver, missedFlags, onRevealTile, onFlagTile,
}) {
  const tileSize = TILE_SIZE_MAP[difficulty] || 38;
  const labelSize = 22;
  const longPressRef = useRef(null);

  const handleTouchStart = useCallback((r, c, e) => {
    longPressRef.current = setTimeout(() => {
      e.preventDefault();
      onFlagTile(r, c);
    }, 500);
  }, [onFlagTile]);

  const handleTouchEnd = useCallback(() => {
    if (longPressRef.current) clearTimeout(longPressRef.current);
  }, []);

  const gridStyle = {
    '--tileSize': `${tileSize}px`,
    '--labelSize': `${labelSize}px`,
    gridTemplateColumns: `var(--labelSize) repeat(${cols}, var(--tileSize))`,
    gridTemplateRows: `var(--labelSize) repeat(${rows}, var(--tileSize))`,
  };

  const getTileClass = (cell, r, c) => {
    const classes = ['tile'];
    if (cell.revealed) {
      classes.push('tile-revealed');
      if (cell.mine) classes.push('tile-mine');
      else if (cell.adjacentMines > 0) classes.push(`tile-num-${cell.adjacentMines}`);
    } else if (cell.flagged) {
      classes.push('tile-hidden', 'tile-flagged');
    } else {
      classes.push('tile-hidden');
      if (heatmapEnabled && heatmapData && heatmapData[r]?.[c] !== null && heatmapData[r]?.[c] !== undefined) {
        classes.push('heat-active');
      }
    }
    if (gameOver && !cell.revealed && !cell.flagged && cell.mine && missedFlags?.has(`${r},${c}`)) {
      classes.push('missed-flag');
    }
    return classes.join(' ');
  };

  const getTileContent = (cell) => {
    if (cell.revealed) {
      if (cell.mine) return '💥';
      if (cell.adjacentMines > 0) return cell.adjacentMines;
      return '';
    }
    if (cell.flagged) return '🚩';
    return '';
  };

  return (
    <div className="grid" style={gridStyle} onContextMenu={e => e.preventDefault()} role="grid" aria-label="Minesweeper Board">
      {/* Corner */}
      <div className="grid-label grid-corner"></div>

      {/* Column headers */}
      {Array.from({ length: cols }, (_, c) => (
        <div key={`col-${c}`} className="grid-label grid-col-label">{colToLetter(c)}</div>
      ))}

      {/* Rows */}
      {Array.from({ length: rows }, (_, r) => (
        <React.Fragment key={`row-${r}`}>
          <div className="grid-label grid-row-label">{r + 1}</div>
          {Array.from({ length: cols }, (_, c) => {
            const cell = board[r]?.[c] || { mine: false, revealed: false, flagged: false, adjacentMines: 0 };
            const heatVal = (!cell.revealed && !cell.flagged && heatmapEnabled && heatmapData)
              ? heatmapData[r]?.[c] : null;

            const tLabel = tileCoordToLabel(r, c);
            let ariaLabel = `Tile ${tLabel}. `;
            if (cell.revealed) {
              if (cell.mine) ariaLabel += 'Detonated mine.';
              else ariaLabel += `${cell.adjacentMines} adjacent mines.`;
            } else if (cell.flagged) {
              ariaLabel += 'Flagged.';
            } else {
              ariaLabel += 'Unrevealed.';
            }

            return (
              <div
                key={`tile-${r}-${c}`}
                role="button"
                tabIndex={0}
                aria-label={ariaLabel}
                className={getTileClass(cell, r, c)}
                style={{
                  ...(heatVal !== null && heatVal !== undefined
                    ? { '--heat': heatVal.toFixed(3) }
                    : {}),
                }}
                title={tLabel}
                onClick={(e) => { e.preventDefault(); onRevealTile(r, c); }}
                onContextMenu={(e) => { e.preventDefault(); onFlagTile(r, c); }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onRevealTile(r, c);
                  if (e.key === ' ' || e.key.toLowerCase() === 'f') {
                    e.preventDefault();
                    onFlagTile(r, c);
                  }
                }}
                onTouchStart={(e) => handleTouchStart(r, c, e)}
                onTouchEnd={handleTouchEnd}
                onTouchMove={handleTouchEnd}
              >
                {getTileContent(cell)}
              </div>
            );
          })}
        </React.Fragment>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// PURE GAME LOGIC FUNCTIONS (no React, no side effects)
// ═══════════════════════════════════════════════════════════

export function forEachNeighbor(r, c, rows, cols, callback) {
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
        callback(nr, nc);
      }
    }
  }
}

export function colToLetter(c) {
  if (c < 26) return String.fromCharCode(65 + c);
  return String.fromCharCode(65 + Math.floor(c / 26) - 1) + String.fromCharCode(65 + (c % 26));
}

export function tileCoordToLabel(r, c) {
  return colToLetter(c) + (r + 1);
}

export function labelToCoord(label, rows, cols) {
  const match = label.trim().toUpperCase().match(/^([A-Z])(\d+)$/);
  if (!match) return null;
  const col = match[1].charCodeAt(0) - 65;
  const row = parseInt(match[2]) - 1;
  if (row < 0 || row >= rows || col < 0 || col >= cols) return null;
  return { row, col };
}

// ─── Board Initialization ──────────────────────────────────

export function createEmptyBoard(rows, cols) {
  const board = [];
  for (let r = 0; r < rows; r++) {
    board[r] = [];
    for (let c = 0; c < cols; c++) {
      board[r][c] = { mine: false, revealed: false, flagged: false, adjacentMines: 0 };
    }
  }
  return board;
}

export function initBoard(rows, cols, totalMines, safeRow, safeCol) {
  const board = createEmptyBoard(rows, cols);

  // Place mines (avoid 3x3 safe zone around first click)
  let placed = 0;
  while (placed < totalMines) {
    const r = Math.floor(Math.random() * rows);
    const c = Math.floor(Math.random() * cols);
    if (board[r][c].mine) continue;
    if (Math.abs(r - safeRow) <= 1 && Math.abs(c - safeCol) <= 1) continue;
    board[r][c].mine = true;
    placed++;
  }

  // Calculate adjacent mine counts
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (board[r][c].mine) continue;
      let count = 0;
      forEachNeighbor(r, c, rows, cols, (nr, nc) => {
        if (board[nr][nc].mine) count++;
      });
      board[r][c].adjacentMines = count;
    }
  }
  return board;
}

// ─── Reveal with Flood Fill ────────────────────────────────

export function revealTileOnBoard(board, rows, cols, r, c) {
  const cell = board[r][c];
  if (cell.revealed || cell.flagged) return { board, tilesRevealed: 0, hitMine: false };

  if (cell.mine) {
    return { board, tilesRevealed: 0, hitMine: true };
  }

  const newBoard = board.map(row => row.map(cell => ({ ...cell })));
  newBoard[r][c].revealed = true;
  let tilesRevealed = 1;

  // Flood fill for 0-adjacent tiles
  if (newBoard[r][c].adjacentMines === 0) {
    const queue = [[r, c]];
    while (queue.length > 0) {
      const [cr, cc] = queue.shift();
      forEachNeighbor(cr, cc, rows, cols, (nr, nc) => {
        const neighbor = newBoard[nr][nc];
        if (!neighbor.revealed && !neighbor.mine && !neighbor.flagged) {
          neighbor.revealed = true;
          tilesRevealed++;
          if (neighbor.adjacentMines === 0) queue.push([nr, nc]);
        }
      });
    }
  }

  return { board: newBoard, tilesRevealed, hitMine: false };
}

// ─── Flag Toggle ───────────────────────────────────────────

export function toggleFlagOnBoard(board, r, c) {
  const newBoard = board.map(row => row.map(cell => ({ ...cell })));
  const cell = newBoard[r][c];
  if (cell.revealed) return { board: newBoard, delta: 0 };

  cell.flagged = !cell.flagged;
  return { board: newBoard, delta: cell.flagged ? 1 : -1 };
}

// ─── Reveal All (for game over) ────────────────────────────

export function revealAllTiles(board) {
  return board.map(row => row.map(cell => ({ ...cell, revealed: true })));
}

// ─── Mine Probability Heatmap ──────────────────────────────

export function computeProbabilityMap(board, rows, cols, totalMines) {
  const prob = Array.from({ length: rows }, () => Array(cols).fill(null));

  let totalUnknown = 0;
  let flaggedCount = 0;
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      if (board[r][c].flagged) flaggedCount++;
      else if (!board[r][c].revealed) totalUnknown++;
    }
  const globalProb = totalUnknown > 0
    ? Math.max(0, Math.min(1, (totalMines - flaggedCount) / totalUnknown))
    : 0;

  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      if (!board[r][c].revealed && !board[r][c].flagged)
        prob[r][c] = globalProb;

  // Constraint pass
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = board[r][c];
      if (!cell.revealed || cell.mine || cell.adjacentMines === 0) continue;

      let flagCount = 0;
      const hidden = [];
      forEachNeighbor(r, c, rows, cols, (nr, nc) => {
        const n = board[nr][nc];
        if (n.flagged) flagCount++;
        else if (!n.revealed) hidden.push([nr, nc]);
      });

      const remaining = cell.adjacentMines - flagCount;
      if (hidden.length === 0) continue;

      const localProb = Math.max(0, Math.min(1, remaining / hidden.length));

      hidden.forEach(([hr, hc]) => {
        if (remaining === hidden.length) {
          prob[hr][hc] = 1.0;
        } else if (remaining === 0) {
          prob[hr][hc] = 0.0;
        } else {
          if (prob[hr][hc] === null || localProb > prob[hr][hc]) {
            prob[hr][hc] = localProb;
          }
        }
      });
    }
  }
  return prob;
}

// ─── Missed Flags Detection ───────────────────────────────

export function findMissedFlags(board, rows, cols) {
  const missed = new Set();
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = board[r][c];
      if (!cell.revealed || cell.mine || cell.adjacentMines === 0) continue;

      let hiddenCount = 0;
      let flagCount = 0;
      const hiddenMines = [];
      forEachNeighbor(r, c, rows, cols, (nr, nc) => {
        const n = board[nr][nc];
        if (n.flagged) flagCount++;
        else if (!n.revealed) {
          hiddenCount++;
          if (n.mine) hiddenMines.push(`${nr},${nc}`);
        }
      });

      const remaining = cell.adjacentMines - flagCount;
      if (remaining > 0 && remaining === hiddenCount) {
        hiddenMines.forEach(key => missed.add(key));
      }
    }
  }
  return missed;
}

// ─── Click Pattern Analysis ────────────────────────────────

export function classifyClick(r, c, rows, cols) {
  const isTopBottom = r === 0 || r === rows - 1;
  const isLeftRight = c === 0 || c === cols - 1;
  if (isTopBottom && isLeftRight) return 'corners';
  if (isTopBottom || isLeftRight) return 'edges';
  return 'center';
}

export function getPlayerStyleSummary(clickPatterns) {
  const p = clickPatterns;
  if (p.totalClicks < 3) return null;
  const dominant = ['corners', 'edges', 'center'].reduce((a, b) => p[a] > p[b] ? a : b);
  const avgTime = p.timings.length > 0
    ? (p.timings.reduce((a, b) => a + b, 0) / p.timings.length).toFixed(1)
    : null;
  const pace = avgTime
    ? (parseFloat(avgTime) < 2 ? 'plays very fast' : parseFloat(avgTime) > 6 ? 'plays slowly and carefully' : 'plays at a steady pace')
    : '';
  return `The soldier prefers clicking ${dominant} (${p[dominant]}/${p.totalClicks} clicks)${pace ? ', and ' + pace : ''} (avg ${avgTime}s between moves).`;
}

// ─── Auto-Solver Logic ────────────────────────────────────

function getAdjacentCells(board, r, c, rows, cols) {
  const neighbors = [];
  forEachNeighbor(r, c, rows, cols, (nr, nc) => {
    neighbors.push({ r: nr, c: nc, cell: board[nr][nc] });
  });
  return neighbors;
}

/**
 * Returns { type, r, c, message } or null if no move found.
 * type: 'flag' | 'reveal'
 */
export function findDeterministicMove(board, rows, cols) {
  // Rule 1: Flag obvious mines
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = board[r][c];
      if (!cell.revealed || cell.adjacentMines === 0) continue;
      const neighbors = getAdjacentCells(board, r, c, rows, cols);
      const unrevealed = neighbors.filter(n => !n.cell.revealed && !n.cell.flagged);
      const flaggedCount = neighbors.filter(n => n.cell.flagged).length;

      if (unrevealed.length > 0 && unrevealed.length === cell.adjacentMines - flaggedCount) {
        const target = unrevealed[0];
        return {
          type: 'flag', r: target.r, c: target.c,
          message: `Rule 1 (Basic Flag): Tile ${tileCoordToLabel(r, c)} needs ${cell.adjacentMines} mines. Exactly ${unrevealed.length} unrevealed spot(s) remain. ${tileCoordToLabel(target.r, target.c)} MUST be a mine. Flagging.`,
        };
      }
    }
  }

  // Rule 2: Reveal obvious safe squares
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = board[r][c];
      if (!cell.revealed || cell.adjacentMines === 0) continue;
      const neighbors = getAdjacentCells(board, r, c, rows, cols);
      const unrevealed = neighbors.filter(n => !n.cell.revealed && !n.cell.flagged);
      const flaggedCount = neighbors.filter(n => n.cell.flagged).length;

      if (unrevealed.length > 0 && flaggedCount === cell.adjacentMines) {
        const target = unrevealed[0];
        return {
          type: 'reveal', r: target.r, c: target.c,
          message: `Rule 2 (Free Clear): Tile ${tileCoordToLabel(r, c)} needs ${cell.adjacentMines} mines, ${flaggedCount} flagged. Remaining spots are safe. Clearing ${tileCoordToLabel(target.r, target.c)}.`,
        };
      }
    }
  }

  // Rule 3: Subset logic
  const frontier = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = board[r][c];
      if (!cell.revealed || cell.adjacentMines === 0) continue;
      const neighbors = getAdjacentCells(board, r, c, rows, cols);
      const unrevealed = neighbors.filter(n => !n.cell.revealed && !n.cell.flagged);
      const flaggedCount = neighbors.filter(n => n.cell.flagged).length;
      const missingMines = cell.adjacentMines - flaggedCount;
      if (unrevealed.length > 0 && missingMines > 0) {
        frontier.push({ r, c, unrevealed, missingMines });
      }
    }
  }

  for (let i = 0; i < frontier.length; i++) {
    for (let j = 0; j < frontier.length; j++) {
      if (i === j) continue;
      const A = frontier[i];
      const B = frontier[j];
      if (Math.abs(A.r - B.r) > 2 || Math.abs(A.c - B.c) > 2) continue;

      let isSubset = true;
      for (const nA of A.unrevealed) {
        if (!B.unrevealed.find(nB => nB.r === nA.r && nB.c === nA.c)) {
          isSubset = false; break;
        }
      }

      if (isSubset && A.unrevealed.length < B.unrevealed.length) {
        const diff = B.unrevealed.filter(nB => !A.unrevealed.find(nA => nA.r === nB.r && nA.c === nB.c));
        const minesDiff = B.missingMines - A.missingMines;

        if (minesDiff === 0) {
          const target = diff[0];
          return {
            type: 'reveal', r: target.r, c: target.c,
            message: `Rule 3 (Advanced Subset): ${tileCoordToLabel(A.r, A.c)}'s spots are inside ${tileCoordToLabel(B.r, B.c)}'s. Extra spot ${tileCoordToLabel(target.r, target.c)} MUST be safe. Clearing.`,
          };
        } else if (minesDiff === diff.length) {
          const target = diff[0];
          return {
            type: 'flag', r: target.r, c: target.c,
            message: `Rule 3 (Advanced Subset): ${tileCoordToLabel(target.r, target.c)} MUST be a mine. Flagging.`,
          };
        }
      }
    }
  }

  return null;
}

export function findRandomGuess(board, rows, cols) {
  const available = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!board[r][c].revealed && !board[r][c].flagged) available.push({ r, c });
    }
  }
  if (available.length === 0) return null;
  const pick = available[Math.floor(Math.random() * available.length)];
  return {
    type: 'reveal', r: pick.r, c: pick.c,
    message: `Rule 4 (Probability Guess): No 100% logic available. Taking a calculated blind guess on ${tileCoordToLabel(pick.r, pick.c)}. Brace yourself!`,
  };
}

// ─── Utility ──────────────────────────────────────────────

export function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

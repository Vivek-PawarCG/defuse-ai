import { describe, it, expect } from 'vitest';
import { createEmptyBoard, initBoard, toggleFlagOnBoard } from './gameLogic.js';

describe('Minesweeper Game Logic', () => {
  it('creates an empty board of correct dimensions', () => {
    const rows = 9;
    const cols = 9;
    const board = createEmptyBoard(rows, cols);

    expect(board.length).toBe(rows);
    expect(board[0].length).toBe(cols);
    expect(board[0][0].revealed).toBe(false);
    expect(board[0][0].mine).toBe(false);
  });

  it('initializes board with exact number of mines', () => {
    const rows = 9;
    const cols = 9;
    const mines = 10;
    // Simulate first click at center (4, 4)
    const board = initBoard(rows, cols, mines, 4, 4);

    let mineCount = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (board[r][c].mine) mineCount++;
      }
    }

    expect(mineCount).toBe(mines);
    // Ensure first click is NEVER a mine
    expect(board[4][4].mine).toBe(false);
  });

  it('toggles flags correctly', () => {
    const board = createEmptyBoard(5, 5);
    
    // Flag it
    const res1 = toggleFlagOnBoard(board, 2, 2);
    expect(res1.board[2][2].flagged).toBe(true);
    expect(res1.delta).toBe(1);

    // Unflag it
    const res2 = toggleFlagOnBoard(res1.board, 2, 2);
    expect(res2.board[2][2].flagged).toBe(false);
    expect(res2.delta).toBe(-1);
  });
});

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TopBar from './TopBar.jsx';
import React from 'react';

describe('TopBar Component', () => {
  const mockProps = {
    minesRemaining: 10,
    time: 123,
    difficulty: 'rookie',
    personality: 'drill-sergeant',
    voiceEnabled: true,
    heatmapEnabled: false,
    gameOver: false,
    onSwitchDifficulty: vi.fn(),
    onSwitchPersonality: vi.fn(),
    onToggleVoice: vi.fn(),
    onToggleHeatmap: vi.fn(),
    onAutoSolve: vi.fn(),
    onSurrender: vi.fn(),
    onShowLeaderboard: vi.fn(),
  };

  it('renders stats correctly', () => {
    render(<TopBar {...mockProps} />);
    expect(screen.getByText('10')).toBeDefined();
    expect(screen.getByText('123')).toBeDefined();
    expect(screen.getByText('ROOKIE')).toBeDefined();
  });

  it('triggers difficulty switch on click', () => {
    render(<TopBar {...mockProps} />);
    const cadetBtn = screen.getByText('CADET');
    fireEvent.click(cadetBtn);
    expect(mockProps.onSwitchDifficulty).toHaveBeenCalledWith('cadet');
  });

  it('triggers leaderboard toggle', () => {
    render(<TopBar {...mockProps} />);
    const lbBtn = screen.getByTitle('View Global Hall of Fame');
    fireEvent.click(lbBtn);
    expect(mockProps.onShowLeaderboard).toHaveBeenCalled();
  });

  it('renders the game title', () => {
    render(<TopBar {...mockProps} />);
    expect(screen.getByText('DEFUSE')).toBeDefined();
  });
});

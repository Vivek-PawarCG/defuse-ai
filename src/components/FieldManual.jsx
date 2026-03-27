import React from 'react';

export default function FieldManual({ onClose }) {
  return (
    <div className="modal-overlay active" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box manual-box">
        <div className="modal-header">
          <span className="blink-dot"></span>
          <span>FIELD MANUAL — TACTICS & PATTERNS</span>
          <button className="btn-close-modal" onClick={onClose}>×</button>
        </div>
        <div className="manual-content">
          <h3>CORE DIRECTIVES</h3>
          <ul>
            <li><strong>LEFT CLICK:</strong> Reveal a tile.</li>
            <li><strong>RIGHT CLICK (or LONG PRESS):</strong> Place a flag on a suspected mine.</li>
            <li><strong>NUMBERS:</strong> Indicate exactly how many mines are hiding in the 8 adjacent squares.</li>
            <li><strong>OBJECTIVE:</strong> Reveal all safe tiles. You do not need to flag every mine to win.</li>
          </ul>

          <h3>TACTICAL PATTERNS</h3>
          <p>Expert defusers memorize logic patterns to clear sectors rapidly. Study these common scenarios (where 'X' is a mine and '✓' is safe):</p>

          <div className="pattern-item">
            <h4>1. The 1-1 Pattern</h4>
            <p>On a flat wall of tiles, if you see two 1s next to each other, the tile next to the second 1 is always safe.</p>
            <div className="pattern-diagram">
              <code>[1] [1] [ ]<br />[X] [✓] [✓]</code>
            </div>
          </div>

          <div className="pattern-item">
            <h4>2. The 1-2-1 Pattern</h4>
            <p>When you see 1-2-1 against a wall of hidden tiles, the mines are always in front of the 1s. The tile in front of the 2 is safe.</p>
            <div className="pattern-diagram">
              <code>[1] [2] [1]<br />[X] [✓] [X]</code>
            </div>
          </div>

          <div className="pattern-item">
            <h4>3. The 1-2-2-1 Pattern</h4>
            <p>Similar to 1-2-1, but the mines are always in front of the 2s, and the tiles in front of the 1s are safe.</p>
            <div className="pattern-diagram">
              <code>[1] [2] [2] [1]<br />[✓] [X] [X] [✓]</code>
            </div>
          </div>

          <div className="pattern-item">
            <h4>4. The Corner 1</h4>
            <p>If a 1 is touching only one unrevealed tile, that tile MUST be a mine. Flag it immediately.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

import { CellConflict, CellPosition, SudokuValidationError } from './errors';

export interface Board {
  /** 9x9 grid, 0 marks an empty cell. */
  readonly cells: number[][];
  /** Source location of each cell, same shape as cells. */
  readonly positions: CellPosition[][];
}

type Unit = 'row' | 'column' | 'box';

function unitCoordinates(unit: Unit, index: number): Array<[number, number]> {
  const coords: Array<[number, number]> = [];

  if (unit === 'row') {
    for (let col = 0; col < 9; col++) coords.push([index, col]);
  } else if (unit === 'column') {
    for (let row = 0; row < 9; row++) coords.push([row, index]);
  } else {
    const boxRow = Math.floor(index / 3) * 3;
    const boxCol = (index % 3) * 3;
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        coords.push([boxRow + row, boxCol + col]);
      }
    }
  }

  return coords;
}

/**
 * Checks the standard sudoku constraint (no repeated digit in any row,
 * column, or 3x3 box) without checking solvability. Throws with every
 * conflict found, rather than stopping at the first one, so a single
 * malformed board doesn't require repeated fix-and-retry cycles.
 */
export function validateBoard(board: Board): void {
  const conflicts: CellConflict[] = [];
  const units: Unit[] = ['row', 'column', 'box'];

  for (const unit of units) {
    for (let index = 0; index < 9; index++) {
      const seen = new Map<number, [number, number]>();

      for (const [row, col] of unitCoordinates(unit, index)) {
        const value = board.cells[row][col];
        if (value === 0) continue;

        const previous = seen.get(value);
        if (previous) {
          const [prevRow, prevCol] = previous;
          conflicts.push({
            value,
            unit,
            unitIndex: index + 1,
            first: board.positions[prevRow][prevCol],
            second: board.positions[row][col],
          });
        } else {
          seen.set(value, [row, col]);
        }
      }
    }
  }

  if (conflicts.length > 0) {
    throw new SudokuValidationError(conflicts);
  }
}

export function formatBoard(board: Board): string {
  const lines: string[] = [];

  for (let row = 0; row < 9; row++) {
    if (row > 0 && row % 3 === 0) {
      lines.push('------+-------+------');
    }

    const rowText = board.cells[row]
      .map((value, col) => {
        const text = value === 0 ? '.' : String(value);
        return col > 0 && col % 3 === 0 ? `| ${text}` : text;
      })
      .join(' ');

    lines.push(rowText);
  }

  return lines.join('\n');
}

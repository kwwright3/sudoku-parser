import { Board } from './board';

function boxIndex(row: number, col: number): number {
  return Math.floor(row / 3) * 3 + Math.floor(col / 3);
}

function countCandidates(used: number): number {
  let count = 0;
  for (let value = 1; value <= 9; value++) {
    if ((used & (1 << value)) === 0) count++;
  }
  return count;
}

/**
 * Solves a board by backtracking, filling one cell at a time and always
 * choosing the empty cell with the fewest remaining candidates next (the
 * standard MRV heuristic). That ordering is what keeps this fast on
 * hard puzzles instead of degenerating into a near-exhaustive search.
 *
 * This does not check that the givens are internally consistent - call
 * validateBoard first if that matters. A board with conflicting givens
 * may still "solve" by ignoring the conflict, since a fixed cell is never
 * revisited. Returns null if no assignment of the empty cells satisfies
 * the row/column/box constraints.
 */
export function solveSudoku(board: Board): Board | null {
  const cells = board.cells.map((row) => row.slice());
  const rowUsed = new Array<number>(9).fill(0);
  const colUsed = new Array<number>(9).fill(0);
  const boxUsed = new Array<number>(9).fill(0);

  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const value = cells[row][col];
      if (value === 0) continue;
      const bit = 1 << value;
      rowUsed[row] |= bit;
      colUsed[col] |= bit;
      boxUsed[boxIndex(row, col)] |= bit;
    }
  }

  const empties: Array<[number, number]> = [];
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (cells[row][col] === 0) empties.push([row, col]);
    }
  }

  function backtrack(startIndex: number): boolean {
    if (startIndex === empties.length) return true;

    let bestIndex = startIndex;
    let bestUsed = 0;
    let bestCount = 10;

    for (let i = startIndex; i < empties.length; i++) {
      const [row, col] = empties[i];
      const used = rowUsed[row] | colUsed[col] | boxUsed[boxIndex(row, col)];
      const count = countCandidates(used);
      if (count < bestCount) {
        bestIndex = i;
        bestUsed = used;
        bestCount = count;
        if (count === 0) break;
      }
    }

    if (bestCount === 0) return false;

    const chosen = empties[bestIndex];
    empties[bestIndex] = empties[startIndex];
    empties[startIndex] = chosen;

    const [row, col] = chosen;
    const box = boxIndex(row, col);

    for (let value = 1; value <= 9; value++) {
      const bit = 1 << value;
      if (bestUsed & bit) continue;

      cells[row][col] = value;
      rowUsed[row] |= bit;
      colUsed[col] |= bit;
      boxUsed[box] |= bit;

      if (backtrack(startIndex + 1)) return true;

      cells[row][col] = 0;
      rowUsed[row] &= ~bit;
      colUsed[col] &= ~bit;
      boxUsed[box] &= ~bit;
    }

    return false;
  }

  if (!backtrack(0)) return null;

  return { cells, positions: board.positions };
}

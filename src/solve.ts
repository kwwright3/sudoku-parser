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
 * Shared backtracking core for solveSudoku and countSolutions. Explores
 * complete assignments of the empty cells, always filling the cell with
 * the fewest remaining candidates next (the standard MRV heuristic), and
 * calls onSolution each time it reaches one. onSolution returns true to
 * stop the search (a single solution is enough, or a caller-chosen limit
 * has been reached) or false to keep looking for more.
 *
 * Does not check that the givens are internally consistent - call
 * validateBoard first if that matters. A board with conflicting givens
 * may still yield a "solution" that ignores the conflict, since a fixed
 * cell is never revisited.
 */
function search(board: Board, onSolution: (cells: number[][]) => boolean): void {
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
    if (startIndex === empties.length) return onSolution(cells);

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

  backtrack(0);
}

/**
 * Solves a board by backtracking. Returns null if no assignment of the
 * empty cells satisfies the row/column/box constraints.
 */
export function solveSudoku(board: Board): Board | null {
  let solution: number[][] | null = null;

  search(board, (cells) => {
    solution = cells.map((row) => row.slice());
    return true;
  });

  return solution ? { cells: solution, positions: board.positions } : null;
}

/**
 * Counts distinct solutions, stopping as soon as `limit` is reached
 * rather than exhausting the search space. Puzzle generators need to
 * know "is this still unique" far more often than "exactly how many
 * solutions does this have", and the former is much cheaper to answer:
 * a non-unique board is usually caught after the second solution turns
 * up, not after a full enumeration.
 */
export function countSolutions(board: Board, limit = 2): number {
  let count = 0;

  search(board, () => {
    count += 1;
    return count >= limit;
  });

  return count;
}

/**
 * True if the board has exactly one solution. Does not check the givens
 * for internal conflicts first; run validateBoard beforehand if the
 * input isn't already trusted, since a board with conflicting givens can
 * still resolve to a single (meaningless) completion.
 */
export function hasUniqueSolution(board: Board): boolean {
  return countSolutions(board, 2) === 1;
}

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseSudoku } from './parse';
import { solveSudoku, countSolutions, hasUniqueSolution } from './solve';

const PUZZLE_TEXT = `
53. .7. ...
6.. 195 ...
.98 ... .6.
8.. .6. ..3
4.. 8.3 ..1
7.. .2. ..6
.6. ... 28.
... 419 ..5
... .8. .79
`;

const SOLUTION_ROWS = [
  '534678912',
  '672195348',
  '198342567',
  '859761423',
  '426853791',
  '713924856',
  '961537284',
  '287419635',
  '345286179',
];

// A board with no duplicate givens (validateBoard would accept it), but
// still unsolvable: the last cell of row 0 must be 9 to complete the row,
// while column 9 already has a 9 elsewhere.
const UNSOLVABLE_TEXT = `
12345678.
........9
.........
.........
.........
.........
.........
.........
.........
`;

test('solves a puzzle with a unique solution', () => {
  const board = parseSudoku(PUZZLE_TEXT);
  const solved = solveSudoku(board);
  assert.ok(solved);
  assert.deepEqual(
    solved.cells.map((row) => row.join('')),
    SOLUTION_ROWS
  );
});

test('does not mutate the board passed in', () => {
  const board = parseSudoku(PUZZLE_TEXT);
  solveSudoku(board);
  assert.equal(board.cells[0].join(''), '530070000');
});

test('returns the same positions as the input board', () => {
  const board = parseSudoku(PUZZLE_TEXT);
  const solved = solveSudoku(board);
  assert.ok(solved);
  assert.equal(solved.positions, board.positions);
});

test('returns the board unchanged when it is already fully solved', () => {
  const text = SOLUTION_ROWS.join('\n');
  const board = parseSudoku(text);
  const solved = solveSudoku(board);
  assert.ok(solved);
  assert.deepEqual(
    solved.cells.map((row) => row.join('')),
    SOLUTION_ROWS
  );
});

test('returns null for a board with no valid completion', () => {
  const board = parseSudoku(UNSOLVABLE_TEXT);
  assert.equal(solveSudoku(board), null);
});

test('hasUniqueSolution is true for a puzzle with one solution', () => {
  const board = parseSudoku(PUZZLE_TEXT);
  assert.equal(hasUniqueSolution(board), true);
});

test('hasUniqueSolution is true for an already-solved board', () => {
  const board = parseSudoku(SOLUTION_ROWS.join('\n'));
  assert.equal(hasUniqueSolution(board), true);
});

test('countSolutions returns 0 for an unsolvable board', () => {
  const board = parseSudoku(UNSOLVABLE_TEXT);
  assert.equal(countSolutions(board), 0);
});

test('countSolutions stops at the limit instead of enumerating everything', () => {
  const emptyBoardText = Array(9).fill('.........').join('\n');
  const board = parseSudoku(emptyBoardText);
  assert.equal(countSolutions(board, 2), 2);
  assert.equal(hasUniqueSolution(board), false);
});

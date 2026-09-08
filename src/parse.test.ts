import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseSudoku } from './parse';
import { SudokuParseError } from './errors';

const VALID_TEXT = `
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

test('parses a well-formed board', () => {
  const board = parseSudoku(VALID_TEXT);
  assert.equal(board.cells.length, 9);
  assert.equal(board.cells[0].join(''), '530070000');
  assert.equal(board.cells[8].join(''), '000080079');
});

test('accepts 0 and . interchangeably for empty cells', () => {
  const text = VALID_TEXT.replace(/\./g, '0');
  const board = parseSudoku(text);
  assert.equal(board.cells[0][2], 0);
});

test('skips comment and decoration-only lines anywhere in the input', () => {
  const text = `# a puzzle
53. .7. ...
------------
6.. 195 ...
.98 ... .6.
8.. .6. ..3
4.. 8.3 ..1
7.. .2. ..6
.6. ... 28.
... 419 ..5
... .8. .79
# trailing comment
`;
  const board = parseSudoku(text);
  assert.equal(board.cells.length, 9);
});

test('tracks the source line and column of each cell, skipping separators', () => {
  const board = parseSudoku(VALID_TEXT);
  // row 4 is "8.. .6. ..3" on line 5 of VALID_TEXT (line 1 is blank)
  const row = board.positions[3];
  assert.deepEqual(
    row.map((p) => p.column),
    [1, 2, 3, 5, 6, 7, 9, 10, 11]
  );
  assert.equal(row[0].line, 5);
});

test('rejects an invalid character with its exact line and column', () => {
  const text = `
53. .7. ...
6.x 195 ...
.98 ... .6.
8.. .6. ..3
4.. 8.3 ..1
7.. .2. ..6
.6. ... 28.
... 419 ..5
... .8. .79
`;
  assert.throws(
    () => parseSudoku(text),
    (err: unknown) => {
      assert.ok(err instanceof SudokuParseError);
      assert.equal(err.line, 3);
      assert.equal(err.column, 3);
      assert.match(err.message, /invalid character 'x'/);
      return true;
    }
  );
});

test('rejects a row with too few cells, pointing past the end of the line', () => {
  const text = `
53. .7. ...
6.. 195 ...
.98 ... .6.
8.. .6. .3
4.. 8.3 ..1
7.. .2. ..6
.6. ... 28.
... 419 ..5
... .8. .79
`;
  assert.throws(
    () => parseSudoku(text),
    (err: unknown) => {
      assert.ok(err instanceof SudokuParseError);
      assert.equal(err.line, 5);
      assert.equal(err.column, 11);
      assert.match(err.message, /found 8/);
      return true;
    }
  );
});

test('rejects a row with too many cells', () => {
  const text = `
53. .7. ...
6.. 195 ....
.98 ... .6.
8.. .6. ..3
4.. 8.3 ..1
7.. .2. ..6
.6. ... 28.
... 419 ..5
... .8. .79
`;
  assert.throws(
    () => parseSudoku(text),
    (err: unknown) => {
      assert.ok(err instanceof SudokuParseError);
      assert.equal(err.line, 3);
      assert.match(err.message, /found 10/);
      return true;
    }
  );
});

test('rejects a 10th data row as too many rows', () => {
  const text = VALID_TEXT + '... ... ...\n';
  assert.throws(
    () => parseSudoku(text),
    (err: unknown) => {
      assert.ok(err instanceof SudokuParseError);
      assert.match(err.message, /too many rows/);
      return true;
    }
  );
});

test('rejects fewer than 9 data rows', () => {
  const text = `
53. .7. ...
6.. 195 ...
.98 ... .6.
`;
  assert.throws(
    () => parseSudoku(text),
    (err: unknown) => {
      assert.ok(err instanceof SudokuParseError);
      assert.match(err.message, /expected 9 rows, found 3/);
      return true;
    }
  );
});

test('handles CRLF line endings the same as LF', () => {
  const text = VALID_TEXT.replace(/\n/g, '\r\n');
  const board = parseSudoku(text);
  assert.equal(board.cells.length, 9);
  assert.equal(board.positions[0][0].line, 2);
});

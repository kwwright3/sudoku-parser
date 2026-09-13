# sudoku-parser

Reads sudoku boards out of plain text. People paste puzzles into forums,
notes apps, and chat messages in all kinds of slightly-off formats: extra
spaces, a stray letter instead of a digit, one row with eight cells instead
of nine. A parser that just throws "invalid board" makes you hunt through
81 characters by hand to find the problem. This one tells you exactly which
line and column is wrong, and shows you the offending row with a caret
pointing at it.

No dependencies. Standard library only.

## Usage

```ts
import { parseSudoku, validateBoard, formatBoard } from 'sudoku-parser';

const text = `
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

const board = parseSudoku(text);
validateBoard(board);
console.log(formatBoard(board));
```

```
5 3 . | . 7 . | . . .
6 . . | 1 9 5 | . . .
. 9 8 | . . . | . 6 .
------+-------+------
8 . . | . 6 . | . . 3
4 . . | 8 . 3 | . . 1
7 . . | . 2 . | . . 6
------+-------+------
. 6 . | . . . | 2 8 .
. . . | 4 1 9 | . . 5
. . . | . 8 . | . 7 9
```

Accepted characters inside a row: digits `1`-`9`, `.` or `0` for an empty
cell, and any of the whitespace or divider characters ` `, `\t`, `|`, `+`,
`-` (ignored, purely for readability). Lines that are blank, made entirely
of divider characters, or start with `#` are skipped and don't count
toward the 9 rows.

## Error messages

A malformed character:

```ts
parseSudoku(`
53. .7. ...
6.x 195 ...
...
`);
```

```
invalid character 'x' (line 3, column 3)
  6.x 195 ...
    ^
```

A row with the wrong number of cells:

```
expected 9 cells in this row, found 8 (line 5, column 12)
  8.. .6. .3
             ^
```

Two clues that conflict once the board is assembled:

```ts
import { validateBoard } from 'sudoku-parser';

validateBoard(board); // throws SudokuValidationError
```

```
line 1, column 1 and line 1, column 3 both contain 5 in row 1
```

`SudokuValidationError` carries a `conflicts` array (value, unit, index,
and the source position of both cells) so a caller can build its own
reporting instead of parsing the message text.

- `solveSudoku(board: Board): Board | null` — fills in the empty cells by
  backtracking, returning a new `Board` (same `positions`), or `null` if
  no assignment satisfies the constraints. Does not check the givens for
  internal conflicts first; run `validateBoard` beforehand if the input
  isn't already trusted.

```ts
import { parseSudoku, solveSudoku, formatBoard } from 'sudoku-parser';

const solved = solveSudoku(parseSudoku(text));
if (solved) console.log(formatBoard(solved));
```

## API

- `parseSudoku(text: string): Board` — parses text into a 9x9 grid.
  Throws `SudokuParseError` on malformed input.
- `validateBoard(board: Board): void` — checks for duplicate digits in
  any row, column, or box. Throws `SudokuValidationError` listing every
  conflict found (not just the first).
- `solveSudoku(board: Board): Board | null` — solves the board by
  backtracking, or returns `null` if it has no solution.
- `formatBoard(board: Board): string` — renders a board back to the
  boxed text layout shown above.
- `Board` — `{ cells: number[][], positions: CellPosition[][] }`, where
  `cells[r][c]` is `0` for empty and `positions[r][c]` is where that cell
  came from in the source text.

## Status

Parsing, constraint validation, and solving are done. Next up: a
uniqueness checker (for puzzle generation) and support for alternate
input formats.

import { Board } from './board';
import { CellPosition, SudokuParseError } from './errors';

// Characters that are allowed anywhere in a content row purely for
// readability (box dividers, alignment) and carry no board data.
const SEPARATOR_CHARS = new Set([' ', '\t', '|', '+', '-']);

function isDecorationLine(line: string): boolean {
  const trimmed = line.trim();
  return trimmed.length === 0 || /^[-+|\s]+$/.test(trimmed);
}

/**
 * Reads a sudoku board out of plain text. Accepts digits 1-9 for clues,
 * '.' or '0' for empty cells, and ignores whitespace plus common divider
 * characters ('|', '+', '-') and lines starting with '#'. Anything else
 * is a parse error naming the exact line and column.
 */
export function parseSudoku(text: string): Board {
  const rawLines = text.split(/\r\n|\r|\n/);
  const cells: number[][] = [];
  const positions: CellPosition[][] = [];

  for (let lineIndex = 0; lineIndex < rawLines.length; lineIndex++) {
    const rawLine = rawLines[lineIndex];
    const lineNumber = lineIndex + 1;

    if (rawLine.trim().startsWith('#') || isDecorationLine(rawLine)) {
      continue;
    }

    if (cells.length === 9) {
      throw new SudokuParseError(
        'too many rows: a sudoku board has exactly 9',
        lineNumber,
        1,
        rawLine
      );
    }

    const rowCells: number[] = [];
    const rowPositions: CellPosition[] = [];

    for (let charIndex = 0; charIndex < rawLine.length; charIndex++) {
      const ch = rawLine[charIndex];
      const column = charIndex + 1;

      if (SEPARATOR_CHARS.has(ch)) {
        continue;
      }

      if (ch === '.' || ch === '0') {
        rowCells.push(0);
        rowPositions.push({ line: lineNumber, column });
        continue;
      }

      if (ch >= '1' && ch <= '9') {
        rowCells.push(Number(ch));
        rowPositions.push({ line: lineNumber, column });
        continue;
      }

      throw new SudokuParseError(
        `invalid character '${ch}' (expected a digit 1-9 or '.' for an empty cell)`,
        lineNumber,
        column,
        rawLine
      );
    }

    if (rowCells.length !== 9) {
      throw new SudokuParseError(
        `expected 9 cells in this row, found ${rowCells.length}`,
        lineNumber,
        rawLine.length + 1,
        rawLine
      );
    }

    cells.push(rowCells);
    positions.push(rowPositions);
  }

  if (cells.length !== 9) {
    const lastLineNumber = Math.max(rawLines.length, 1);
    const lastLine = rawLines[rawLines.length - 1] ?? '';
    throw new SudokuParseError(
      `expected 9 rows, found ${cells.length}`,
      lastLineNumber,
      lastLine.length + 1,
      lastLine
    );
  }

  return { cells, positions };
}

export interface CellPosition {
  readonly line: number;
  readonly column: number;
}

/**
 * Thrown while reading raw text into a board. Always carries the exact
 * line and column of the offending character, plus the source line itself,
 * so the message can point at the problem instead of just naming it.
 */
export class SudokuParseError extends Error {
  readonly line: number;
  readonly column: number;
  readonly sourceLine: string;

  constructor(message: string, line: number, column: number, sourceLine: string) {
    super(SudokuParseError.render(message, line, column, sourceLine));
    this.name = 'SudokuParseError';
    this.line = line;
    this.column = column;
    this.sourceLine = sourceLine;
  }

  private static render(message: string, line: number, column: number, sourceLine: string): string {
    const pointer = ' '.repeat(Math.max(0, column - 1)) + '^';
    return `${message} (line ${line}, column ${column})\n  ${sourceLine}\n  ${pointer}`;
  }
}

export interface CellConflict {
  readonly value: number;
  readonly unit: 'row' | 'column' | 'box';
  readonly unitIndex: number;
  readonly first: CellPosition;
  readonly second: CellPosition;
}

/**
 * Thrown by validateBoard when two cells in the same row, column, or box
 * hold the same digit. Reports both source locations so the caller can
 * see which two clues in their original text actually disagree.
 */
export class SudokuValidationError extends Error {
  readonly conflicts: readonly CellConflict[];

  constructor(conflicts: CellConflict[]) {
    super(SudokuValidationError.render(conflicts));
    this.name = 'SudokuValidationError';
    this.conflicts = conflicts;
  }

  private static render(conflicts: CellConflict[]): string {
    return conflicts
      .map((conflict) => {
        const first = `line ${conflict.first.line}, column ${conflict.first.column}`;
        const second = `line ${conflict.second.line}, column ${conflict.second.column}`;
        return `${first} and ${second} both contain ${conflict.value} in ${conflict.unit} ${conflict.unitIndex}`;
      })
      .join('\n');
  }
}

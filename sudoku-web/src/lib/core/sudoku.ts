export type SudokuGrid = number[][]

export class UnsolvableGridError extends Error { }

class Validator {
    private rows: Set<number>[];
    private cols: Set<number>[];
    private blocks: Set<number>[][];

    constructor() {
        this.rows = createSets(9);
        this.cols = createSets(9);
        this.blocks = [
            createSets(3),
            createSets(3),
            createSets(3),
        ];
    }

    tryAdd(val: number, row: number, col: number): boolean {
        if (
            this.rows[row].has(val) ||
            this.cols[col].has(val) ||
            this.blocks[Math.floor(row / 3)][Math.floor(col / 3)].has(val)
        ) {
            return false;
        }

        this.rows[row].add(val);
        this.cols[col].add(val);
        this.blocks[Math.floor(row / 3)][Math.floor(col / 3)].add(val);
        return true;
    }

    remove(val: number, row: number, col: number) {
        this.rows[row].delete(val);
        this.cols[col].delete(val);
        this.blocks[Math.floor(row / 3)][Math.floor(col / 3)].delete(val);
    }
}

const createSets = (n: number): Set<number>[] => {
    const result = [];
    for (let i = 0; i < n; i++) {
        result.push(new Set<number>());
    }
    return result;
}

const solveImpl = (sudokuGrid: SudokuGrid, row: number, col: number, validator: Validator): boolean => {
    if (row === 9) {
        return true;
    }

    const nextRow = col === 8 ? row + 1 : row;
    const nextCol = (col + 1) % 9;

    if (sudokuGrid[row][col] !== 0) {
        return solveImpl(sudokuGrid, nextRow, nextCol, validator);
    }

    for (let check = 1; check < 10; check++) {
        if (!validator.tryAdd(check, row, col)) {
            continue;
        }
        sudokuGrid[row][col] = check;

        if (solveImpl(sudokuGrid, nextRow, nextCol, validator)) {
            return true;
        }

        validator.remove(check, row, col);
    }
    sudokuGrid[row][col] = 0;
    return false;
}

export const solve = (sudokuGrid: SudokuGrid): SudokuGrid => {
    const validator = new Validator();
    const copied = sudokuGrid.map(r => [...r]);

    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            const val = copied[r][c];
            if (val === 0) {
                continue;
            }

            if (!validator.tryAdd(val, r, c)) {
                throw new UnsolvableGridError();
            }

            copied[r][c] = -val;
        }
    }

    if (!solveImpl(copied, 0, 0, validator)) {
        throw new UnsolvableGridError();
    }

    return copied;
}
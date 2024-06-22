import type tensorflow from '@tensorflow/tfjs';
import type { SudokuGrid } from './sudoku';
import type { LayersModel, Tensor } from '@tensorflow/tfjs';

// Could probably put this sort of type somewhere more suitable
export type Orientation = 0 | 90 | 180 | 270;
export type SudokuPredictorResult = {
    orientation: Orientation;
    sudokuGrid: SudokuGrid;
};

export type SudokuPredictorOptions = {
    minOrientationConfidence: number;
    minDigitConfidence: number;
};

const DEFAULT_OPTIONS: SudokuPredictorOptions = {
    minOrientationConfidence: 0.8,
    minDigitConfidence: 0.9
};

const reshapeForModel = (tf: typeof tensorflow, image: Tensor): Tensor => {
    const cells = tf.split(image, 9, 0).flatMap((col) => tf.split(col, 9, 1));
    return tf.concat(cells).reshape([-1, 28, 28, 1]);
};

export class SudokuPredictor {
    private tf: typeof tensorflow;
    private digitsModel: LayersModel;
    private orientationModel: LayersModel;
    private options: SudokuPredictorOptions;

    constructor(
        tf: typeof tensorflow,
        digitsModel: LayersModel,
        orientationModel: LayersModel,
        options: Partial<SudokuPredictorOptions> = {}
    ) {
        this.tf = tf;
        this.digitsModel = digitsModel;
        this.orientationModel = orientationModel;
        this.options = {
            ...DEFAULT_OPTIONS,
            ...options
        };
    }

    predict(data: Uint8Array): SudokuPredictorResult {
        return this.tf.tidy<SudokuPredictorResult>(() => {
            const sudokuTensor = this.tf.tensor(data, [252, 252]).div(this.tf.scalar(255));
            const orientation = this.predictOrientation(sudokuTensor);
            const fixed = this.fixRotation(sudokuTensor, orientation);
            const sudokuGrid = this.predictSudokuDigits(fixed);

            return {
                orientation,
                sudokuGrid
            };
        });
    }

    private fixRotation(image: Tensor, orientation: Orientation): Tensor {
        // Work this out
        // if (orientation != 0) {
        //     return tf.image.rotateWithOffset(image as tf.Tensor4D, (360-orientation) * Math.PI / 180)
        // }
        return image;
    }

    private predictSudokuDigits(sudokuImage: Tensor): number[][] {
        const cells = reshapeForModel(this.tf, sudokuImage);
        const result = this.digitsModel.predict(cells) as Tensor;

        const data = result.arraySync() as number[][];
        const predictions = result.argMax(1).dataSync();

        const grid = [];
        for (let r = 0; r < 9; r++) {
            const row: number[] = [];
            grid.push(row);
            for (let c = 0; c < 9; c++) {
                const i = r * 9 + c;
                const conf = data[i][predictions[i]];
                if (conf > this.options.minDigitConfidence) {
                    row.push(predictions[i]);
                } else {
                    row.push(0);
                }
            }
        }

        return grid;
    }

    private predictOrientation(sudokuImage: Tensor): Orientation {
        const cells = reshapeForModel(this.tf, sudokuImage);
        const result = this.orientationModel.predict(cells) as Tensor;

        const data = result.arraySync() as number[][];
        const predictions = result.argMax(1).dataSync();

        let maxIdx = 0;
        const counts = [0, 0, 0, 0];
        for (let i = 0; i < predictions.length; i++) {
            const conf = data[i][predictions[i]];
            if (conf > this.options.minOrientationConfidence) {
                counts[predictions[i]] += 1;
                if (counts[predictions[i]] > maxIdx) {
                    maxIdx = predictions[i];
                }
            }
        }

        switch (maxIdx) {
            case 0:
                return 0;
            case 1:
                return 270;
            case 2:
                return 180;
            case 3:
                return 90;
        }

        return 0;
    }
}

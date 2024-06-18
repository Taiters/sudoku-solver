import * as tf from "@tensorflow/tfjs";

// Could probably put this sort of type somewhere more suitable
export type Orientation = 0 | 90 | 180 | 270;
export type SudokuPredictorResult = {
    orientation: Orientation;
    sudokuGrid: number[][];
}

export type SudokuPredictorOptions = {
    minOrientationConfidence: number;
    minDigitConfidence: number;
}

const DEFAULT_OPTIONS: SudokuPredictorOptions = {
    minOrientationConfidence: 0.8,
    minDigitConfidence: 0.9,
}


const reshapeForModel = (image: tf.Tensor): tf.Tensor => {
    const cells = tf.split(image, 9, 0).flatMap(col => tf.split(col, 9, 1));
    return tf.concat(cells).reshape([-1, 28, 28, 1]);
}

export class SudokuPredictor {
    private digitsModel: tf.LayersModel;
    private orientationModel: tf.LayersModel;
    private options: SudokuPredictorOptions;

    constructor(digitsModel: tf.LayersModel, orientationModel: tf.LayersModel, options: Partial<SudokuPredictorOptions> = {}) {
        this.digitsModel = digitsModel;
        this.orientationModel = orientationModel;
        this.options = {
            ...DEFAULT_OPTIONS,
            ...options,
        };
    }

    predict(sudokuImage: tf.Tensor): SudokuPredictorResult {
        const orientation = this.predictOrientation(sudokuImage);
        const fixed = this.fixRotation(sudokuImage, orientation);
        const sudokuGrid = this.predictSudokuDigits(fixed);

        return {
            orientation,
            sudokuGrid,
        }
    }

    private fixRotation(image: tf.Tensor, orientation: Orientation): tf.Tensor {
        // Work this out
        // if (orientation != 0) {
        //     return tf.image.rotateWithOffset(image as tf.Tensor4D, (360-orientation) * Math.PI / 180)
        // }
        return image;
    }

    private predictSudokuDigits(sudokuImage: tf.Tensor): number[][] {
        const cells = reshapeForModel(sudokuImage);
        const result = this.digitsModel.predict(cells) as tf.Tensor;

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

    private predictOrientation(sudokuImage: tf.Tensor): Orientation {
        const cells = reshapeForModel(sudokuImage);
        const result = this.orientationModel.predict(cells) as tf.Tensor;

        const data = result.arraySync() as number[][];
        const predictions = result.argMax(1).dataSync();

        let maxIdx = 0;
        const counts = [0, 0, 0, 0];
        for (let i = 0; i < predictions.length; i++) {
            const conf = data[i][predictions[i]];
            if (conf > this.options.minOrientationConfidence) {
                counts[predictions[i]] += 1
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
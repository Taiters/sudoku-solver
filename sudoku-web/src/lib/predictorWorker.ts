import type { LayersModel } from "@tensorflow/tfjs";
import { SudokuPredictor, type Orientation } from "./core/predictor";
import { solve, UnsolvableGridError, type SudokuGrid } from "./core/sudoku";

export type PredictorWorkerMessage = {
  message: "predict";
  data: Uint8Array;
};

export type PredictorWorkerResponse =
  | {
      message: "prediction";
      data: {
        solvedGrid: SudokuGrid;
        orientation: Orientation;
      };
    }
  | {
      message: "ready";
    };

let predictor: SudokuPredictor;

const load = async () => {
  const tf = await import("@tensorflow/tfjs");
  const [digitsModel, orientationModel] = await Promise.all<LayersModel>([
    tf.loadLayersModel("/models/digits_9967_0100_1717968332/model.json"),
    tf.loadLayersModel("/models/orientations_9027_2061_1717970078/model.json"),
  ]);

  predictor = new SudokuPredictor(tf, digitsModel, orientationModel);
  postMessage({ message: "ready" });
};

onmessage = (e: MessageEvent) => {
  if (e.data?.message !== "predict") {
    return;
  }

  const message = e.data as PredictorWorkerMessage;
  const result = predictor.predict(message.data);
  if (result) {
    try {
      const solvedGrid = solve(result.sudokuGrid);
      postMessage({
        message: "prediction",
        data: {
          solvedGrid,
          orientation: result.orientation,
        },
      });
    } catch (err) {
      if (!(err instanceof UnsolvableGridError)) {
        throw err;
      }
    }
  }
};

load();

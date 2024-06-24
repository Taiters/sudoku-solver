import type { Mat, MatVector, Scalar } from "opencv-ts";
import type openCV from "opencv-ts";
import type { FrameContainer } from "./frame";
import { MatBag } from "./matBag";

export type SudokuFrameData = {
  coordinates: number[][];
  sudokuRegion: Uint8Array;
};

export type SudokuFrameProcessorOptions = {
  arcLengthThreshold: number;
  maxDistance: number;
  minArea: number;
  sudokuRegionSize: number;
};

const DEFAULT_OPTIONS: SudokuFrameProcessorOptions = {
  arcLengthThreshold: 0.1,
  maxDistance: 0.25,
  minArea: 1000,
  sudokuRegionSize: 252,
};

const sortPointsClockwise = (points: number[][]): number[][] => {
  points.sort((a, b) => a[1] - b[1]);
  const topPoints = points.slice(0, 2);
  const bottomPoints = points.slice(2);

  topPoints.sort((a, b) => a[0] - b[0]);
  bottomPoints.sort((a, b) => a[0] - b[0]);

  return [topPoints[0], topPoints[1], bottomPoints[0], bottomPoints[1]];
};

export class SudokuFrameProcessor {
  private cv: typeof openCV;
  private options: SudokuFrameProcessorOptions;

  private binary: Mat;
  private sudokuRegion: Mat;
  private hierarchy: Mat;
  private lines: Mat;
  private target: Mat;

  private contours: MatVector;
  private quads: MatVector;
  private centralQuads: MatVector;

  private white: Scalar;

  private matBag: MatBag;

  private deleted: boolean = false;

  constructor(cv: typeof openCV, options: Partial<SudokuFrameProcessorOptions> = {}) {
    this.cv = cv;
    this.options = {
      ...DEFAULT_OPTIONS,
      ...options,
    };

    this.matBag = new MatBag(cv);

    this.binary = new cv.Mat();
    this.sudokuRegion = new cv.Mat();
    this.hierarchy = new cv.Mat();
    this.lines = new cv.Mat();
    this.target = cv.matFromArray(4, 1, cv.CV_32FC2, [
      0,
      0,
      this.options.sudokuRegionSize,
      0,
      0,
      this.options.sudokuRegionSize,
      this.options.sudokuRegionSize,
      this.options.sudokuRegionSize,
    ]);

    this.white = new cv.Scalar(255);

    this.contours = new cv.MatVector();
    this.quads = new cv.MatVector();
    this.centralQuads = new cv.MatVector();
  }

  delete() {
    this.deleted = true;

    this.binary.delete();
    this.sudokuRegion.delete();
    this.hierarchy.delete();
    this.lines.delete();
    this.target.delete();
    this.contours.delete();
    this.quads.delete();
    this.centralQuads.delete();
    this.matBag.reset();
  }

  processFrame(frameContainer: FrameContainer): SudokuFrameData | null {
    const frameMat = frameContainer.mat();
    this.reset();

    this.convertToBinary(frameMat);
    const largest = this.getLargestCentralQuad(frameMat);
    if (!largest) {
      return null;
    }

    const corners = sortPointsClockwise([
      [largest.data32S[0], largest.data32S[1]],
      [largest.data32S[2], largest.data32S[3]],
      [largest.data32S[4], largest.data32S[5]],
      [largest.data32S[6], largest.data32S[7]],
    ]);
    this.updateSudokuRegion(corners);

    return {
      coordinates: corners,
      // If I stop posting to the worker for predictions every time, then we don't need this copy here
      // ...but I'm being lazy, and until then, this is a good place for it.
      sudokuRegion: new Uint8Array(this.sudokuRegion.data),
    };
  }

  private reset() {
    if (this.deleted) {
      return;
    }

    this.contours = this.resetVector(this.contours);
    this.quads = this.resetVector(this.quads);
    this.centralQuads = this.resetVector(this.centralQuads);
    this.matBag.reset();
  }

  private resetVector(value: MatVector | null) {
    if (value) {
      value.delete();
    }
    return new this.cv.MatVector();
  }

  private getDistanceFromCenter(contour: Mat, cx: number, cy: number): [number, number] {
    const moments = this.cv.moments(contour);
    if (moments.m00 == 0) {
      return [Infinity, Infinity];
    }

    const x = moments.m10 / moments.m00;
    const y = moments.m01 / moments.m00;

    return [Math.abs(x - cx), Math.abs(y - cy)];
  }

  private convertToBinary(src: Mat) {
    this.cv.cvtColor(src, this.binary, this.cv.COLOR_BGR2GRAY);
    this.cv.threshold(
      this.binary,
      this.binary,
      0,
      255,
      this.cv.THRESH_BINARY_INV + this.cv.THRESH_OTSU,
    );
  }

  private getLargest(cnts: MatVector): Mat | null {
    let largest = null;
    let largestArea = -Infinity;
    for (let i = 0; i < cnts.size(); i++) {
      const cnt = cnts.get(i);
      const area = Math.abs(this.cv.contourArea(cnt, false));
      if (area > this.options.minArea && area > largestArea) {
        largest = cnt;
        largestArea = area;
      }
    }
    return largest;
  }

  private getLargestCentralQuad(src: Mat) {
    // Get the quads
    this.cv.findContours(
      this.binary,
      this.contours,
      this.hierarchy,
      this.cv.RETR_TREE,
      this.cv.CHAIN_APPROX_SIMPLE,
    );
    for (let i = 0; i < this.contours.size(); i++) {
      const cnt = this.contours.get(i);
      const poly = this.matBag.getMat();
      this.cv.approxPolyDP(
        cnt,
        poly,
        this.options.arcLengthThreshold * this.cv.arcLength(cnt, true),
        true,
      );
      if (poly.size().height == 4) {
        this.quads.push_back(poly);
      }
    }

    // Find the central ones
    const srcSize = src.size();
    const cx = Math.ceil(srcSize.width / 2);
    const cy = Math.ceil(srcSize.height / 2);
    for (let i = 0; i < this.quads.size(); i++) {
      const quad = this.quads.get(i);
      const distance = this.getDistanceFromCenter(quad, cx, cy);
      if (
        distance[0] / srcSize.width < this.options.maxDistance &&
        distance[1] / srcSize.height < this.options.maxDistance
      ) {
        this.centralQuads.push_back(quad);
      }
    }

    return this.getLargest(this.centralQuads);
  }

  private updateSudokuRegion(corners: number[][]) {
    const resultSize = new this.cv.Size(
      this.options.sudokuRegionSize,
      this.options.sudokuRegionSize,
    );
    const source = this.matBag.getMat(() =>
      this.cv.matFromArray(4, 1, this.cv.CV_32FC2, corners.flat()),
    );
    const transform = this.matBag.getMat(() =>
      this.cv.getPerspectiveTransform(source, this.target),
    );
    this.cv.warpPerspective(this.binary, this.sudokuRegion, transform, resultSize);

    // Clean the grid lines
    // @ts-expect-error (Complains about zeros, but it's valid)
    const mask = this.matBag.getMat(() => this.cv.Mat.zeros(252, 252, cv.CV_8U));
    // @ts-expect-error (Complains about arg length)
    this.cv.HoughLinesP(this.sudokuRegion, this.lines, 1, Math.PI / 2, 50, 60, 5);
    for (let i = 0; i < this.lines.rows; i++) {
      const startPoint = new this.cv.Point(
        this.lines.data32S[i * 4],
        this.lines.data32S[i * 4 + 1],
      );
      const endPoint = new this.cv.Point(
        this.lines.data32S[i * 4 + 2],
        this.lines.data32S[i * 4 + 3],
      );
      this.cv.line(mask, startPoint, endPoint, this.white, 2);
    }
    this.cv.bitwise_not(mask, mask);
    this.cv.bitwise_and(mask, this.sudokuRegion, this.sudokuRegion);
  }
}

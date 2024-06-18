import type { Mat, MatVector, Scalar } from 'opencv-ts';
import type openCV from 'opencv-ts';
import type { Orientation, SudokuPredictor } from './predictor';
import { scalar, tensor } from '@tensorflow/tfjs';

export type SudokuFrameData = {
	coordinates: number[][];
	sudokuGrid: number[][];
    orientation: Orientation;
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
	sudokuRegionSize: 252
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
    private predictor: SudokuPredictor;
	private options: SudokuFrameProcessorOptions;

	private src: Mat;
	private binary: Mat;
	private sudokuRegion: Mat;
	private hierarchy: Mat;
	private lines: Mat;
	private target: Mat;

	private contours: MatVector;
	private quads: MatVector;
	private centralQuads: MatVector;

	private white: Scalar;

	private matBag: Mat[] = [];

	constructor(
		cv: typeof openCV,
		width: number,
		height: number,
        predictor: SudokuPredictor,
		options: Partial<SudokuFrameProcessorOptions> = {}
	) {
		this.cv = cv;
        this.predictor = predictor;
		this.options = {
			...DEFAULT_OPTIONS,
			...options
		};

		this.src = new cv.Mat(height, width, this.cv.CV_8UC4);
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
			this.options.sudokuRegionSize
		]);

		this.white = new cv.Scalar(255);

		this.contours = new cv.MatVector();
		this.quads = new cv.MatVector();
		this.centralQuads = new cv.MatVector();
	}

	processFrame(frame: Uint8Array): SudokuFrameData | null {
		this.reset(frame);

		// Convert to binary image
		this.cv.cvtColor(this.src, this.binary, this.cv.COLOR_BGR2GRAY);
		this.cv.threshold(
			this.binary,
			this.binary,
			0,
			255,
			this.cv.THRESH_BINARY_INV + this.cv.THRESH_OTSU
		);

		// Get the quads
		this.cv.findContours(
			this.binary,
			this.contours,
			this.hierarchy,
			this.cv.RETR_TREE,
			this.cv.CHAIN_APPROX_SIMPLE
		);
		for (let i = 0; i < this.contours.size(); i++) {
			const cnt = this.contours.get(i);
			const poly = this.getMat();
			this.cv.approxPolyDP(
				cnt,
				poly,
				this.options.arcLengthThreshold * this.cv.arcLength(cnt, true),
				true
			);
			if (poly.size().height == 4) {
				this.quads.push_back(poly);
			}
		}

		// Find the central ones
		const srcSize = this.src.size();
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

		// Get the largest
		const largest = this.getLargest(this.centralQuads);
		if (!largest) {
			return null;
		}

		// Warp the region
		const corners = sortPointsClockwise([
			[largest.data32S[0], largest.data32S[1]],
			[largest.data32S[2], largest.data32S[3]],
			[largest.data32S[4], largest.data32S[5]],
			[largest.data32S[6], largest.data32S[7]]
		]);
		const resultSize = new this.cv.Size(
			this.options.sudokuRegionSize,
			this.options.sudokuRegionSize
		);
		const source = this.addToMatBag(() =>
			this.cv.matFromArray(4, 1, this.cv.CV_32FC2, corners.flat())
		);
		const transform = this.addToMatBag(() => this.cv.getPerspectiveTransform(source, this.target));
		this.cv.warpPerspective(this.binary, this.sudokuRegion, transform, resultSize);

		// Clean the grid lines
		// @ts-ignore (Complains about zeros, but it's valid)
		const mask = this.addToMatBag(() => this.cv.Mat.zeros(252, 252, cv.CV_8U));
		// @ts-ignore (Complains about arg length)
		this.cv.HoughLinesP(this.sudokuRegion, this.lines, 1, Math.PI / 2, 50, 60, 5);
		for (let i = 0; i < this.lines.rows; i++) {
			const startPoint = new this.cv.Point(
				this.lines.data32S[i * 4],
				this.lines.data32S[i * 4 + 1]
			);
			const endPoint = new this.cv.Point(
				this.lines.data32S[i * 4 + 2],
				this.lines.data32S[i * 4 + 3]
			);
			this.cv.line(mask, startPoint, endPoint, this.white, 2);
		}
		this.cv.bitwise_not(mask, mask);
		this.cv.bitwise_and(mask, this.sudokuRegion, this.sudokuRegion);

		this.cv.imshow('test-region', this.sudokuRegion);

        const predictorInput = tensor(this.sudokuRegion.data, [this.options.sudokuRegionSize, this.options.sudokuRegionSize]).div(scalar(255));
        const result = this.predictor.predict(predictorInput);

		return {
			coordinates: corners,
            orientation: result.orientation,
			sudokuGrid: result.sudokuGrid,
		};
	}

	private getMat() {
		return this.addToMatBag(() => new this.cv.Mat());
	}

	private addToMatBag(createFn: () => Mat): Mat {
		const mat = createFn();
		this.matBag.push(mat);
		return mat;
	}

	private reset(frame: Uint8Array) {
		this.contours = this.resetVector(this.contours);
		this.quads = this.resetVector(this.quads);
		this.centralQuads = this.resetVector(this.centralQuads);

		for (const mat of this.matBag) {
			mat.delete();
		}
		this.matBag = [];

		this.src.data.set(frame);
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

	private getLargest(cnts: MatVector): any {
		let largest;
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
}

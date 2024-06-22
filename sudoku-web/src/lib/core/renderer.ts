import type { Mat } from 'opencv-ts';
import type openCV from 'opencv-ts';
import type { FrameContainer } from './frame';
import { MatBag } from './matBag';


export class SudokuRenderer {
    private cv: typeof openCV;
    private ctx: CanvasRenderingContext2D;
    private size: number;

    private src: Mat;
    private warped: Mat;
    private mask: Mat;

    private source: Mat;
    private matBag: MatBag;

    constructor(cv: typeof openCV, ctx: CanvasRenderingContext2D) {
        this.cv = cv;
        this.ctx = ctx;

        if (ctx.canvas.width !== ctx.canvas.height) {
            throw new Error("Expected a square canvas");
        }

        this.size = ctx.canvas.width;
        this.src = new cv.Mat(this.size, this.size, cv.CV_8UC4);
        this.warped = new cv.Mat();
        this.mask = new cv.Mat();
        this.source = cv.matFromArray(4, 1, cv.CV_32FC2, [
            0,
            0,
            this.size,
            0,
            0,
            this.size,
            this.size,
            this.size,
        ]);
        this.matBag = new MatBag(cv);
    }

    renderGridOnFrame(frame: FrameContainer, solution: number[][], corners: number[][]) {
        this.drawSolution(solution);

        this.matBag.reset();
        this.src.data.set(this.ctx.getImageData(0, 0, this.size, this.size).data);

        const target = this.matBag.getMat(() =>
            this.cv.matFromArray(4, 1, this.cv.CV_32FC2, corners.flat())
        );

        const transform = this.matBag.getMat(() => this.cv.getPerspectiveTransform(this.source, target));
        const frameMat = frame.mat();
        this.cv.warpPerspective(this.src, this.warped, transform, frameMat.size());

        this.cv.threshold(this.warped, this.mask, 1, 255, this.cv.THRESH_BINARY);
        // Remove (subtract) the mask then add the warped image
        // this.cv.addWeighted(this.warped, 1, frameMat, 1, 0, frameMat);
    }

    private drawSolution(solution: number[][]) {
        const width = this.ctx.canvas.width;
        const height = this.ctx.canvas.height;
        this.ctx.clearRect(0, 0, width, height);
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        const cellSize = width / 9;
        const halfCell = cellSize / 2;
        this.ctx.font = `${cellSize / 1.5}px sans-serif`;
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                const val = solution[r][c];
                const x = c * cellSize + halfCell;
                const y = r * cellSize + halfCell;

                if (val < 0) {
                    this.ctx.fillStyle = 'red';
                    this.ctx.fillText(Math.abs(val).toString(), x, y, cellSize);
                } else {
                    this.ctx.fillStyle = 'green';
                    this.ctx.fillText(val.toString(), x, y, cellSize);
                }
            }
        }
    }
}
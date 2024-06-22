import type { Mat } from "opencv-ts";
import openCV from "opencv-ts";

export class FrameContainer {
    private src: Mat;

    constructor(width: number, height: number, cv: typeof openCV) {
        this.src = new cv.Mat(height, width, cv.CV_8UC4);
    }

    update(ctx: CanvasRenderingContext2D) {
        const data = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height).data;
        this.src.data.set(data);
    }

    mat(): Mat {
        return this.src;
    }
}

import type { Mat } from "opencv-ts";
import type openCV from "opencv-ts";

export class FrameContainer {
  private cv: typeof openCV;
  private src: Mat | null = null;
  private width: number = 0;
  private height: number = 0;

  private deleted: boolean = false;

  constructor(cv: typeof openCV) {
    this.cv = cv;
  }

  update(ctx: CanvasRenderingContext2D) {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    const data = ctx.getImageData(0, 0, width, height).data;

    if (!this.src || this.width !== width || this.height !== height) {
      this.resetMat(width, height);
    }

    (this.src as Mat).data.set(data);
  }

  mat(): Mat {
    if (!this.src) {
      throw new Error("Tried getting frame mat before it was created");
    }
    return this.src;
  }

  getImageData(): ImageData {
    return new ImageData(new Uint8ClampedArray(this.mat().data), this.width, this.height);
  }

  delete() {
    this.deleted = true;
    this.src?.delete();
  }

  private resetMat(width: number, height: number) {
    if (this.deleted) {
      return;
    }

    if (this.src) {
      this.src.delete();
    }
    this.src = new this.cv.Mat(height, width, this.cv.CV_8UC4);
    this.width = width;
    this.height = height;
  }
}

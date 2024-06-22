import type { Mat } from 'opencv-ts';
import type openCV from 'opencv-ts';


const DEFAULT_CREATE_FN = (cv: typeof openCV): Mat => new cv.Mat();

export class MatBag {
    private cv: typeof openCV;
    private mats: Mat[] = [];

    constructor(cv: typeof openCV) {
        this.cv = cv;
    }

    getMat(createFn: (cv: typeof openCV) => Mat = DEFAULT_CREATE_FN) {
        const mat = createFn(this.cv);
        this.mats.push(mat);
        return mat;
    }

    reset() {
        for (const mat of this.mats) {
            mat.delete();
        }
        this.mats = [];
    }
}
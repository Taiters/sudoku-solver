import type { Mat } from 'opencv-ts';
import type openCV from 'opencv-ts';


export class SudokuRenderer {
    private cv: typeof openCV;

    constructor(cv: typeof openCV) {
        this.cv = cv;
    }

    renderGridOnFrame(target: Mat) {

    }
}
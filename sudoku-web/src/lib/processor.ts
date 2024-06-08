function convertToBinary(cv: any, input: any, output: any) {
    cv.cvtColor(input, output, cv.COLOR_BGR2GRAY);
    cv.threshold(output, output, 0, 255, cv.THRESH_BINARY_INV + cv.THRESH_OTSU)
}

function getContours(cv: any, input: any, output: any) {
    let heirarchy = new cv.Mat();
    try {
        cv.findContours(input, output, heirarchy, cv.RETR_TREE, cv.CHAIN_APPROX_SIMPLE);
    } finally {
        heirarchy.delete();
    }
}

function getQuads(cv: any, contours: any, output: any, arcLengthThreshold = 0.1) {
    for (let i = 0; i < contours.size(); i++) {
        const tmp = new cv.Mat();
        const cnt = contours.get(i);
        try {
            cv.approxPolyDP(cnt, tmp, arcLengthThreshold * cv.arcLength(cnt, true), true)
            if (tmp.size().height == 4) {
                output.push_back(tmp);
            }
        } finally {
            tmp.delete();
        }
    }
}

function getDistanceFromCenter(cv: any, contour: any, cx: number, cy: number): [number, number] {
    const moments = cv.moments(contour)
    if (moments.m00 == 0) {
        return [Infinity, Infinity];
    }

    const x = moments.m10 / moments.m00;
    const y = moments.m01 / moments.m00;

    return [
        Math.abs(x - cx),
        Math.abs(y - cy),
    ];
}

function getCentralQuads(cv: any, quads: any, output: any, width: number, height: number, maxDistance: number = 0.25) {
    for (let i = 0; i < quads.size(); i++) {
        const quad = quads.get(i);
        const distance = getDistanceFromCenter(cv, quad, Math.ceil(width / 2), Math.ceil(height / 2));

        if (distance[0] / width <= maxDistance && distance[1] / height <= maxDistance) {
            output.push_back(quad);
        }
    }
}

function getLargestQuad(cv: any, quads: any): any {
    let largest;
    let largestArea = -Infinity;
    for (let i = 0; i < quads.size(); i++) {
        const quad = quads.get(i);
        const area = Math.abs(cv.contourArea(quad, false));
        if (area > largestArea) {
            largest = quad;
            largestArea = area;
        }
    }
    return largest;
}

function sortPointsClockwise(points: number[][]): number[][] {
    points.sort((a, b) => a[1] - b[1]);
    const topPoints = points.slice(0, 2);
    const bottomPoints = points.slice(2);

    topPoints.sort((a, b) => a[0] - b[0]);
    bottomPoints.sort((a, b) => a[0] - b[0]);

    return [
        topPoints[0],
        topPoints[1],
        bottomPoints[0],
        bottomPoints[1],
    ];
}


function getSudokuCorners(cv: any, input: any): number[][] | null {
    const imgSize = input.size();
    const contours = new cv.MatVector();
    const quads = new cv.MatVector();
    const central = new cv.MatVector();


    try {
        getContours(cv, input, contours);
        getQuads(cv, contours, quads);
        getCentralQuads(cv, quads, central, imgSize.width, imgSize.height);

        const largestQuad = getLargestQuad(cv, quads);
        if (!largestQuad) {
            return null;
        }

        return sortPointsClockwise([
            [largestQuad.data32S[0], largestQuad.data32S[1]],
            [largestQuad.data32S[2], largestQuad.data32S[3]],
            [largestQuad.data32S[4], largestQuad.data32S[5]],
            [largestQuad.data32S[6], largestQuad.data32S[7]],
        ]);
    } finally {
        contours.delete();
        quads.delete();
        central.delete();
    }
}

function getImageRegion(cv: any, image: any, output: any, points: number[][], size=252) {
    const target = cv.matFromArray(4, 1, cv.CV_32FC2, [
        0, 0,
        size, 0,
        0, size,
        size, size,
    ]);
    const source = cv.matFromArray(4, 1, cv.CV_32FC2, points.flat());
    const resultSize = new cv.Size(size, size);
    try {
        const transform = cv.getPerspectiveTransform(
            source,
            target,
        );
        cv.warpPerspective(image, output, transform, resultSize)
    } finally {
        target.delete();
        source.delete();
    }
}

export function overlaySolution(cv: any, ctx: CanvasRenderingContext2D) {
    let image;

    // TODO: Could probably keep these around for the entire lifetime rather than
    // create / delete per frame
    const binary = new cv.Mat();
    const sudokuRegion = new cv.Mat();
    try {
        image = cv.imread(ctx.canvas);
        convertToBinary(cv, image, binary);
        const corners = getSudokuCorners(cv, binary);

        if (!corners) {
            cv.imshow(ctx.canvas.id, image);
            return;
        }

        for (const corner of corners) {
            const p = new cv.Point(corner[0], corner[1]);
            cv.circle(image, p, 5, new cv.Scalar(0, 255, 0, 255), -1, cv.FILLED)
        }

        getImageRegion(cv, binary, sudokuRegion, corners);

        cv.imshow(ctx.canvas.id, image);
    } finally {
        image?.delete();
        binary.delete();
        sudokuRegion.delete();
    }
}
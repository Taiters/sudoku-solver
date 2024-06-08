<script lang="ts">
	import { cameraStream } from "$lib/store";
	import { onMount } from "svelte";

    let canvasElement: HTMLCanvasElement;
    let videoElement: HTMLVideoElement;

    const cv = window.cv;

    onMount(() => {
        const ctx = canvasElement.getContext('2d', {willReadFrequently: true});
        videoElement.onloadedmetadata = () => {
            videoElement.play();
            canvasElement.width = videoElement.videoWidth;
            canvasElement.height = videoElement.videoHeight;
        }

        function convertToBinary(cv: any, input: any) {
            const output = new cv.Mat();
            cv.cvtColor(input, output, cv.COLOR_BGR2GRAY);
            cv.threshold(output, output ,0,255,cv.THRESH_BINARY_INV+cv.THRESH_OTSU)
            return output;
        }

        function getSudokuCorners(cv: any, input: any) {
            const contours = new cv.MatVector()
            const heirarchy = new cv.Mat()
            cv.findContours(input, contours, heirarchy, cv.RETR_TREE, cv.CHAIN_APPROX_SIMPLE);
            heirarchy.delete();
            return contours;
        }

        // def get_sudoku_corners(img):
        //     cnts = cv2.findContours(img, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)[0]
        //     central_quads = get_quads(near_center(img, cnts))
        //     largest_central = max(central_quads, key=lambda c: abs(cv2.contourArea(c)))
        //     return np.float32(sort_points(largest_central))


        const updateCanvas: VideoFrameRequestCallback = (now, metadata) => {
            ctx?.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
            const image = cv.imread(canvasElement);
            const binary = convertToBinary(cv, image);
            const cnts = getSudokuCorners(cv, binary);
            const color = new cv.Scalar(0, 255, 0);
            cv.drawContours(image, cnts, -1, color, 5, cv.LINE_8);
            cv.imshow('output', image);
            image.delete();
            binary.delete();
            cnts.delete();
            videoElement.requestVideoFrameCallback(updateCanvas);
        }

        videoElement.requestVideoFrameCallback(updateCanvas);
    });

    $: videoElement && (videoElement.srcObject = $cameraStream);
</script>

<video bind:this={videoElement} hidden />
<canvas bind:this={canvasElement} id="output" class="w-full"/>
<script lang="ts">
	import { overlaySolution } from "$lib/processor";
	import { cameraStream } from "$lib/store";
	import { onMount } from "svelte";
    import * as tf from "@tensorflow/tfjs";
	import OpenCvLoader from "./OpenCVLoader.svelte";
	import { SudokuFrameProcessor } from "$lib/core/processor";
	import { SudokuPredictor } from "$lib/core/predictor";

    let canvasElement: HTMLCanvasElement;
    let videoElement: HTMLVideoElement;

    let digitsModel: tf.LayersModel;
    let orientationModel: tf.LayersModel;
    let solution: number | null;
    let grid: number[][] | null;

    let loadedOpenCV = false;

    window.tf = tf;

    onMount(async () => {
        (async () => {
            [digitsModel, orientationModel] = await Promise.all<tf.LayersModel>([
                tf.loadLayersModel('/models/digits_9967_0100_1717968332/model.json'),
                tf.loadLayersModel('/models/orientations_9027_2061_1717970078/model.json'),
            ]);
        })();

        const ctx = canvasElement.getContext('2d', {willReadFrequently: true});
        videoElement.onloadedmetadata = () => {
            videoElement.play();
            canvasElement.width = videoElement.videoWidth;
            canvasElement.height = videoElement.videoHeight;
        }

        const updateCanvas: VideoFrameRequestCallback = async (now, metadata) => {
            if (ctx == null) {
                return;
            }

            ctx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);

            if (frameProcessor) {
                const frame = ctx.getImageData(0, 0, canvasElement.width, canvasElement.height).data;
                const result = frameProcessor.processFrame(new Uint8Array(frame.buffer));

                if (result) {
                    solution = result.orientation;
                    grid = result.sudokuGrid;
                } else {
                    solution = null;
                    grid = null;
                }
            }

            videoElement.requestVideoFrameCallback(updateCanvas);
        }

        videoElement.requestVideoFrameCallback(updateCanvas);
    });

    $: frameProcessor = loaded ? new SudokuFrameProcessor(window.cv, canvasElement.width, canvasElement.height, new SudokuPredictor(digitsModel, orientationModel)) : null;
    $: videoElement && (videoElement.srcObject = $cameraStream);
    $: loadedModels = digitsModel != null && orientationModel != null;
    $: loaded = loadedOpenCV && loadedModels;
</script>

<OpenCvLoader on:loaded={() => loadedOpenCV = true}/>
<video bind:this={videoElement} hidden />
<canvas bind:this={canvasElement} id="output" class="w-full" />
<canvas id="test-region"/>
<canvas id="test-roi"/>
{#if solution != null}
    <p>It's a {solution} mate</p>
{:else}
    <p>I've honestly no idea mate</p>
{/if}
{#if grid != null}
    {#each grid as row}
        {row.join(' ')}<br/>
    {/each}
{/if}
{#if !loaded}
    <div class="text-center absolute text-primary text-lg">
        <span class="loading loading-spinner loading-lg" />
        <p>Loading</p>
    </div>
{/if}
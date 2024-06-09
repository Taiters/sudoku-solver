<script lang="ts">
	import { overlaySolution } from "$lib/processor";
	import { cameraStream } from "$lib/store";
	import { onMount } from "svelte";
    import * as tf from "@tensorflow/tfjs";
	import OpenCvLoader from "./OpenCVLoader.svelte";

    let canvasElement: HTMLCanvasElement;
    let videoElement: HTMLVideoElement;
    let loadedOpenCV = false;
    let loadedModels = false;

    $: loaded = loadedOpenCV && loadedModels;

    onMount(async () => {
        const ctx = canvasElement.getContext('2d', {willReadFrequently: true});
        videoElement.onloadedmetadata = () => {
            videoElement.play();
            canvasElement.width = videoElement.videoWidth;
            canvasElement.height = videoElement.videoHeight;
        }

        const updateCanvas: VideoFrameRequestCallback = (now, metadata) => {
            if (ctx == null) {
                return;
            }

            ctx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);

            if (loaded) {
                overlaySolution(window.cv, ctx);
            }

            videoElement.requestVideoFrameCallback(updateCanvas);
        }

        videoElement.requestVideoFrameCallback(updateCanvas);
    });

    $: videoElement && (videoElement.srcObject = $cameraStream);
</script>

<OpenCvLoader on:loaded={() => loadedOpenCV = true}/>
<video bind:this={videoElement} hidden />
<canvas bind:this={canvasElement} id="output" class="w-full" />
{#if !loaded}
    <div class="text-center absolute text-primary text-lg">
        <span class="loading loading-spinner loading-lg" />
        <p>Loading</p>
    </div>
{/if}
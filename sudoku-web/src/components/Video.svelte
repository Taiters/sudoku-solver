<script lang="ts">
	import { overlaySolution } from "$lib/processor";
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

        const updateCanvas: VideoFrameRequestCallback = (now, metadata) => {
            if (ctx == null) {
                return;
            }

            ctx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
            overlaySolution(window.cv, ctx);

            videoElement.requestVideoFrameCallback(updateCanvas);
        }

        videoElement.requestVideoFrameCallback(updateCanvas);
    });

    $: videoElement && (videoElement.srcObject = $cameraStream);
</script>

<video bind:this={videoElement} hidden />
<canvas bind:this={canvasElement} id="output" class="w-full"/>
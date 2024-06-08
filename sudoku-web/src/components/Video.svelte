<script lang="ts">
	import { cameraStream } from "$lib/store";
	import { onMount } from "svelte";

    let canvasElement: HTMLCanvasElement;
    let videoElement: HTMLVideoElement;

    onMount(() => {
        const ctx = canvasElement.getContext('2d');
        videoElement.onloadedmetadata = () => {
            videoElement.play();
            canvasElement.width = videoElement.videoWidth;
            canvasElement.height = videoElement.videoHeight;
        }

        const updateCanvas: VideoFrameRequestCallback = (now, metadata) => {
            ctx?.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
            videoElement.requestVideoFrameCallback(updateCanvas);
        }

        videoElement.requestVideoFrameCallback(updateCanvas);
    });

    $: videoElement && (videoElement.srcObject = $cameraStream);
</script>

<video bind:this={videoElement} hidden />
<canvas bind:this={canvasElement} class="w-full"/>
<script lang="ts">
  import { cameraStream } from "$lib/store";
  import { onMount } from "svelte";

  export let onFrame: (ctx: CanvasRenderingContext2D) => void;

  let canvasElement: HTMLCanvasElement;
  let videoElement: HTMLVideoElement;

  onMount(async () => {
    const ctx = canvasElement.getContext("2d", { willReadFrequently: true });
    videoElement.onloadedmetadata = () => {
      videoElement.play();
      canvasElement.width = videoElement.videoWidth;
      canvasElement.height = videoElement.videoHeight;
    };

    // eslint-disable-next-line no-undef
    const frameCallback: VideoFrameRequestCallback = async () => {
      if (ctx == null) {
        return;
      }

      ctx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
      onFrame(ctx);
      videoElement.requestVideoFrameCallback(frameCallback);
    };

    videoElement.requestVideoFrameCallback(frameCallback);
  });

  $: {
    if (videoElement) {
      videoElement.srcObject = $cameraStream;
    }
  }
</script>

<video bind:this={videoElement} hidden>
  <track kind="captions" />
</video>
<canvas bind:this={canvasElement} class="w-full" />

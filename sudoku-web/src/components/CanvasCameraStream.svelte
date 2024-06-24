<script lang="ts">
  import { replaceState } from "$app/navigation";
  import { cameraStream } from "$lib/store";
  import { onDestroy, onMount } from "svelte";

  export let onFrame: (ctx: CanvasRenderingContext2D) => void;
  export let canvasElement: HTMLCanvasElement;

  let videoElement: HTMLVideoElement;
  let callbackID: number;
  let destroyed: boolean = false;

  onDestroy(() => {
    videoElement?.cancelVideoFrameCallback(callbackID);
    destroyed = true;
  });

  onMount(async () => {
    const ctx = canvasElement.getContext("2d", { willReadFrequently: true });
    videoElement.onloadedmetadata = () => {
      videoElement.play();
      canvasElement.width = videoElement.videoWidth;
      canvasElement.height = videoElement.videoHeight;
    };

    // eslint-disable-next-line no-undef
    const frameCallback: VideoFrameRequestCallback = async () => {
      if (ctx == null || canvasElement == null) {
        return;
      }

      ctx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
      onFrame(ctx);
      if (!destroyed) {
        callbackID = videoElement.requestVideoFrameCallback(frameCallback);
      }
    };

    callbackID = videoElement.requestVideoFrameCallback(frameCallback);
  });

  $: {
    if (!$cameraStream) {
      replaceState("", {
        hasEnabledCamera: false,
      });
    } else if (videoElement) {
      videoElement.srcObject = $cameraStream;
    }
  }
</script>

<video bind:this={videoElement} hidden>
  <track kind="captions" />
</video>
<canvas bind:this={canvasElement} class="w-full rounded-lg border-2 border-base-300 shadow-inner" />

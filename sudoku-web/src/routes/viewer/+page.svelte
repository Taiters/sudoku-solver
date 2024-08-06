<script lang="ts">
  import { goto } from "$app/navigation";
  import SudokuViewer from "$components/SudokuViewer.svelte";
  import { cameraStream, image } from "$lib/store";
  import posthog from "posthog-js";
  import { onMount } from "svelte";
  import FaCamera from "svelte-icons/fa/FaCamera.svelte";

  let canvasElement: HTMLCanvasElement;

  onMount(() => {
    if (!$cameraStream) {
      goto("/");
    }
  });

  function takeImage() {
    if (!canvasElement) {
      return;
    }

    $image = canvasElement.toDataURL();
    posthog.capture("image_captured");
    goto("/image");
  }
</script>

{#if $cameraStream}
  <h1 class="text-2xl mb-2">Look at a Sudoku puzzle</h1>
  <div class="p-2 m-2 border-2 border-base-300 rounded-lg border-dashed">
    <SudokuViewer bind:canvasElement />
  </div>
  <button
    class="btn btn-primary mt-8 btn-circle"
    disabled={!canvasElement}
    on:click={takeImage}
  >
    <div class="w-6 h-6">
      <FaCamera />
    </div>
  </button>
{/if}

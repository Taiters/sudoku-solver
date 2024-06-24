<script lang="ts">
  import { goto } from "$app/navigation";
  import SudokuViewer from "$components/SudokuViewer.svelte";
  import { cameraStream } from "$lib/store";
  import { onMount } from "svelte";
  import FaCamera from "svelte-icons/fa/FaCamera.svelte";

  let canvasElement: HTMLCanvasElement;

  onMount(() => {
    if (!$cameraStream) {
      goto("/");
    }
  });

  function downloadImage() {
    if (!canvasElement) {
      return;
    }

    const link = document.createElement("a");
    link.download = "sudoku.png";
    link.href = canvasElement.toDataURL();
    link.click();
  }
</script>

{#if $cameraStream}
  <div class="container center flex flex-col h-screen justify-center items-center">
    <h1 class="text-2xl mb-2">Look at a Sudoku puzzle</h1>
    <div class="p-2 m-2 border-2 border-base-300 rounded-lg border-dashed">
      <SudokuViewer bind:canvasElement />
    </div>
    <button
      class="btn btn-primary mt-8 btn-circle"
      disabled={!canvasElement}
      on:click={downloadImage}
    >
      <div class="w-6 h-6">
        <FaCamera />
      </div>
    </button>
  </div>
{/if}

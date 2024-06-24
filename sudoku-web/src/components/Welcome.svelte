<script lang="ts">
  import { pushState } from "$app/navigation";
  import { cameraStream } from "$lib/store";

  let requestingStream = false;
  let deniedPermission = false;

  async function handleClick() {
    requestingStream = true;
    deniedPermission = false;
    try {
      $cameraStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      pushState("", {
        hasEnabledCamera: true,
      });
    } catch {
      deniedPermission = true;
    } finally {
      requestingStream = false;
    }
  }
</script>

<h1 class="text-4xl font-bold">Sudoku Solver</h1>
<p>Solve a sudoku puzzle with your camera</p>
<button disabled={requestingStream} on:click={handleClick} class="btn btn-primary mt-8">
  Solve a puzzle
</button>
<p class="text-error h-2">
  {#if deniedPermission}Permission denied{/if}
</p>

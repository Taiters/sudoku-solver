<script lang="ts">
  import { goto } from "$app/navigation";
  import SudokuViewer from "$components/SudokuViewer.svelte";
  import { cameraStream } from "$lib/store";
  import { onMount } from "svelte";

  onMount(() => {
    if (!$cameraStream) {
      goto("/");
    }
  });
</script>

{#if $cameraStream}
  <div class="container center flex flex-col h-screen justify-center items-center">
    <h1 class="text-2xl mb-2">Look at a Sudoku puzzle</h1>
    <div class="p-2 m-2 border-2 border-base-300 rounded-lg border-dashed">
      <SudokuViewer />
    </div>
  </div>
{/if}

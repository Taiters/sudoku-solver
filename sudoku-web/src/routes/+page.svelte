<script lang="ts">
  import SudokuViewer from "$components/SudokuViewer.svelte";
  import Welcome from "$components/Welcome.svelte";
  import { cameraStream } from "$lib/store";
</script>

<div class="container center flex flex-col h-screen justify-center items-center">
  {#if $cameraStream}
    <SudokuViewer />
  {:else}
    <Welcome />
  {/if}
</div>

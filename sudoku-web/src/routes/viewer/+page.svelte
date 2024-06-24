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

<div class="container center flex flex-col h-screen justify-center items-center">
  {#if $cameraStream}
    <SudokuViewer />
  {/if}
</div>

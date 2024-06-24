<script lang="ts">
  import { page } from "$app/stores";
  import SudokuViewer from "$components/SudokuViewer.svelte";
  import Welcome from "$components/Welcome.svelte";
</script>

<div class="container center flex flex-col h-screen justify-center items-center">
  {#if $page.state.hasEnabledCamera}
    <SudokuViewer />
  {:else}
    <Welcome />
  {/if}
</div>

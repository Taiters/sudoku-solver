<script lang="ts">
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";
  import { image } from "$lib/store";
  import FaDownload from "svelte-icons/fa/FaDownload.svelte";
  import FaArrowLeft from "svelte-icons/fa/FaArrowLeft.svelte";

  onMount(() => {
    if (!$image) {
      goto("/");
    }
  });

</script>

{#if $image}
  <div class="p-2 m-2 border-2 border-base-300 rounded-lg border-dashed">
    <img src={$image} alt="Captured puzzle" />
  </div>
  <div>
    <button
      class="btn btn-primary mt-8 mr-2 btn-circle"
      on:click={() => history.back()}
    >
      <div class="w-6 h-6">
        <FaArrowLeft />
      </div>
    </button>
    <a
      class="btn btn-primary mt-8 btn-circle"
      download="sudoku.png"
      href={$image}
    >
      <div class="w-6 h-6">
        <FaDownload />
      </div>
    </a>
  </div>
{/if}

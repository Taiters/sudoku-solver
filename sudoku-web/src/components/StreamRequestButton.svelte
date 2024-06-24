<script lang="ts">
  import { goto } from "$app/navigation";
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
      await goto("/viewer");
    } catch {
      deniedPermission = true;
    } finally {
      requestingStream = false;
    }
  }
</script>

<button disabled={requestingStream} on:click={handleClick} class="btn btn-primary mt-8">
  Solve a puzzle
</button>
<p class="text-error h-2">
  {#if deniedPermission}Permission denied{/if}
</p>

<script lang="ts">
  import { goto } from "$app/navigation";
  import { cameraStream } from "$lib/store";
  import posthog from "posthog-js";

  let requestingStream = false;
  let deniedPermission = false;

  async function handleClick() {
    requestingStream = true;
    deniedPermission = false;
    try {
      posthog.capture("requested_permission");
      $cameraStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      posthog.capture("permission_granted");
      await goto("/viewer");
    } catch {
      posthog.capture("permission_denied");
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

<script context="module" lang="ts">
  export type LoadedResources = {
    cv: typeof openCV;
  };

  declare global {
    interface Window {
      cv: typeof openCV;
    }
  }
</script>

<script lang="ts">
  import { createEventDispatcher, onMount } from "svelte";
  import type openCV from "opencv-ts";

  const SCRIPT_ID = "opencv_script";
  const PATH = "/opencv.js";

  const dispatch = createEventDispatcher<{ loaded: LoadedResources }>();

  let cv: typeof openCV;

  if (!document.getElementById(SCRIPT_ID)) {
    const openCVScript = document.createElement("script");

    openCVScript.id = SCRIPT_ID;
    openCVScript.setAttribute("src", PATH);
    openCVScript.setAttribute("defer", "");
    openCVScript.setAttribute("type", "text/javascript");

    openCVScript.onload = () => {
      cv = window.cv;
    };

    document.body.appendChild(openCVScript);
  }

  function waitUntilCVEvaluated(cv: typeof openCV, cb: () => undefined) {
    // Seems there can be a delay between loaded and
    // things being available. Can check here to only fire
    // the event when Mat is available.
    if (cv.Mat) {
      cb();
    } else {
      setTimeout(() => waitUntilCVEvaluated(cv, cb), 1);
    }
  }

  $: {
    if (cv) {
      waitUntilCVEvaluated(cv, () => {
        dispatch("loaded", {
          cv,
        });
      });
    }
  }
</script>

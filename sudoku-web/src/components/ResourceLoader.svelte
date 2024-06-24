<script context="module" lang="ts">
  declare global {
    interface Window {
      cv: typeof openCV;
    }
  }
</script>

<script lang="ts">
  import type openCV from "opencv-ts";

  export let onLoaded: (cv: typeof openCV) => void;

  const SCRIPT_ID = "opencv_script";
  const PATH = "/opencv.js";

  if (!document.getElementById(SCRIPT_ID)) {
    const openCVScript = document.createElement("script");

    openCVScript.id = SCRIPT_ID;
    openCVScript.setAttribute("src", PATH);
    openCVScript.setAttribute("defer", "");
    openCVScript.setAttribute("type", "text/javascript");

    openCVScript.onload = () => {
      waitUntilCVEvaluated(window.cv, () => {
        onLoaded(window.cv);
      });
    };

    document.body.appendChild(openCVScript);
  } else {
    // Wait until stuff has rendered
    setTimeout(() => {
      waitUntilCVEvaluated(window.cv, () => {
        onLoaded(window.cv);
      });
    }, 1);
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
</script>

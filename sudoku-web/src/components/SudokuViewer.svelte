<script lang="ts">
  import ResourceLoader from "./ResourceLoader.svelte";
  import { SudokuFrameProcessor, type SudokuFrameData } from "$lib/core/processor";
  import type { SudokuGrid } from "$lib/core/sudoku";
  import { FrameContainer } from "$lib/core/frame";
  import CanvasCameraStream from "./CanvasCameraStream.svelte";
  import { SudokuRenderer } from "$lib/core/renderer";
  import type { PredictorWorkerResponse } from "$lib/predictorWorker";

  let loaded: boolean = false;
  let workerReady: boolean = false;

  let solutionElement: HTMLCanvasElement;

  let frameData: SudokuFrameData | null;
  let solvedGrid: SudokuGrid | null;

  let container: FrameContainer;
  let processor: SudokuFrameProcessor;
  let renderer: SudokuRenderer;

  const worker = new Worker(new URL("../lib/predictorWorker.ts", import.meta.url), {
    type: "module",
  });

  worker.onmessage = (e: MessageEvent) => {
    const response = e.data as PredictorWorkerResponse;
    if (response.message === "ready") {
      workerReady = true;
    }

    if (response.message === "prediction") {
      solvedGrid = response.data.solvedGrid;
    }
  };

  const copyData = (toCopy: Uint8Array): Uint8Array => {
    return new Uint8Array(toCopy);
  };

  const onCameraFrame = (ctx: CanvasRenderingContext2D) => {
    if (!loaded) {
      return;
    }

    container.update(ctx);
    frameData = processor.processFrame(container);

    if (frameData) {
      // This is slow as it's a copy. Transferable objects might help here
      // https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers#passing_data_by_transferring_ownership_transferable_objects
      // worker.postMessage({
      //   message: "predict",
      //   data: frameData.sudokuRegion,
      // });

      // Also seems like we can't directly transfer the sudokuRegion, as it's from a shared WASM memory
      // so instead, we can copy it here then transfer the ownership (Which seems faster)
      // (I've moved the copy into the processor, so no visible change, but good to remember this..)
      worker.postMessage(
        {
          message: "predict",
          data: frameData.sudokuRegion,
        },
        [frameData.sudokuRegion.buffer],
      );

      if (solvedGrid) {
        renderer.renderGridOnFrame(container, solvedGrid, frameData.coordinates);
        ctx.putImageData(container.getImageData(), 0, 0);
      }
    }
  };

  $: loaded = processor && container && renderer && workerReady;
</script>

<CanvasCameraStream onFrame={onCameraFrame} />

{#if !loaded}
  <div class="text-center absolute text-primary text-lg">
    <span class="loading loading-spinner loading-lg" />
    <p>Loading</p>
  </div>
{/if}

<canvas bind:this={solutionElement} width="256" height="256" hidden />

<ResourceLoader
  on:loaded={(event) => {
    processor = new SudokuFrameProcessor(event.detail.cv);
    container = new FrameContainer(event.detail.cv);
    renderer = new SudokuRenderer(
      event.detail.cv,
      // @ts-expect-error: getContext shouldn't be null here..
      solutionElement.getContext("2d", { willReadFrequently: true }),
    );
  }}
/>

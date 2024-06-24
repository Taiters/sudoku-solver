<script lang="ts">
  import ResourceLoader from "./ResourceLoader.svelte";
  import { SudokuFrameProcessor, type SudokuFrameData } from "$lib/core/processor";
  import type { SudokuGrid } from "$lib/core/sudoku";
  import { FrameContainer } from "$lib/core/frame";
  import CanvasCameraStream from "./CanvasCameraStream.svelte";
  import { SudokuRenderer } from "$lib/core/renderer";
  import type { PredictorWorkerResponse } from "$lib/predictorWorker";
  import { onDestroy } from "svelte";

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

  onDestroy(() => {
    worker.terminate();

    container?.delete();
    processor?.delete();
    renderer?.delete();
  });

  const onCameraFrame = (ctx: CanvasRenderingContext2D) => {
    if (!loaded) {
      return;
    }

    container.update(ctx);
    frameData = processor.processFrame(container);

    if (frameData) {
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

<div class="flex items-center justify-center">
  <CanvasCameraStream onFrame={onCameraFrame} />
  {#if !loaded}
    <div class="text-center absolute text-primary text-lg">
      <span class="loading loading-spinner loading-lg" />
      <p>Loading</p>
    </div>
  {/if}
</div>

<canvas bind:this={solutionElement} width="256" height="256" hidden />

<ResourceLoader
  onLoaded={(cv) => {
    processor = new SudokuFrameProcessor(cv);
    container = new FrameContainer(cv);
    renderer = new SudokuRenderer(
      cv,
      // @ts-expect-error: getContext shouldn't be null here..
      solutionElement.getContext("2d", { willReadFrequently: true }),
    );
  }}
/>

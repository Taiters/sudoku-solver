<script lang="ts">
	import ResourceLoader from './ResourceLoader.svelte';
	import { SudokuFrameProcessor, type SudokuFrameData } from '$lib/core/processor';
	import { SudokuPredictor } from '$lib/core/predictor';
	import { UnsolvableGridError, solve, type SudokuGrid } from '$lib/core/sudoku';
	import { FrameContainer } from '$lib/core/frame';
	import CanvasCameraStream from './CanvasCameraStream.svelte';
	import { SudokuRenderer } from '$lib/core/renderer';
	import cv from 'opencv-ts';

	let loaded: boolean = false;
	let solutionElement: HTMLCanvasElement;

	let frameData: SudokuFrameData | null;
	let solvedGrid: SudokuGrid | null;

	let container: FrameContainer;
	let processor: SudokuFrameProcessor;
	let predictor: SudokuPredictor;
	let renderer: SudokuRenderer;

	const onCameraFrame = (ctx: CanvasRenderingContext2D) => {
		if (!loaded) {
			return;
		}

		container.update(ctx);
		frameData = processor.processFrame(container);

		if (frameData?.sudokuGrid) {
			try {
				solvedGrid = solve(frameData.sudokuGrid);
				renderer.renderGridOnFrame(container, solvedGrid, frameData.coordinates);
				ctx.putImageData(container.getImageData(), 0, 0);
			} catch (err) {
				if (err instanceof UnsolvableGridError) {
					console.warn(err);
				} else {
					console.error(err);
					throw err;
				}
			}
		}
	};
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
		predictor = new SudokuPredictor(
			event.detail.tf,
			event.detail.digitsModel,
			event.detail.orientationModel
		);
		processor = new SudokuFrameProcessor(event.detail.cv, predictor);
		container = new FrameContainer(event.detail.cv);
		renderer = new SudokuRenderer(
			event.detail.cv,
			// @ts-ignore
			solutionElement.getContext('2d', { willReadFrequently: true })
		);
		loaded = true;
	}}
/>

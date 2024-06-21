<script lang="ts">
	import type openCV from 'opencv-ts';
	import { cameraStream } from '$lib/store';
	import { onMount } from 'svelte';
	import * as tf from '@tensorflow/tfjs';
	import OpenCvLoader from './OpenCVLoader.svelte';
	import { SudokuFrameProcessor, type SudokuFrameData } from '$lib/core/processor';
	import { SudokuPredictor } from '$lib/core/predictor';
	import { UnsolvableGridError, solve, type SudokuGrid } from '$lib/core/sudoku';

	let solutionElement: HTMLCanvasElement;
	let canvasElement: HTMLCanvasElement;
	let videoElement: HTMLVideoElement;
	let cv: typeof openCV;

	let digitsModel: tf.LayersModel;
	let orientationModel: tf.LayersModel;

	let frameData: SudokuFrameData | null;
	let solvedGrid: SudokuGrid | null;

	onMount(async () => {
		(async () => {
			[digitsModel, orientationModel] = await Promise.all<tf.LayersModel>([
				tf.loadLayersModel('/models/digits_9967_0100_1717968332/model.json'),
				tf.loadLayersModel('/models/orientations_9027_2061_1717970078/model.json')
			]);
		})();

		const ctx = canvasElement.getContext('2d', { willReadFrequently: true });
		const solutionCtx = solutionElement.getContext('2d');
		videoElement.onloadedmetadata = () => {
			videoElement.play();
			canvasElement.width = videoElement.videoWidth;
			canvasElement.height = videoElement.videoHeight;
		};

		const updateCanvas: VideoFrameRequestCallback = async (now, metadata) => {
			if (ctx == null || solutionCtx == null) {
				return;
			}

			ctx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);

			if (frameProcessor) {
				const frame = ctx.getImageData(0, 0, canvasElement.width, canvasElement.height).data;
				frameData = frameProcessor.processFrame(new Uint8Array(frame.buffer));

				if (frameData?.sudokuGrid) {
					try {
						solvedGrid = solve(frameData.sudokuGrid);
						solutionCtx.clearRect(0, 0, solutionElement.width, solutionElement.height);
						solutionCtx.strokeStyle = 'blue';
						solutionCtx.lineWidth = 5;
						solutionCtx.strokeRect(0, 0, solutionElement.width, solutionElement.height);
						solutionCtx.textAlign = 'center';
						solutionCtx.textBaseline = 'middle';
						const cellSize = solutionElement.width / 9;
						const halfCell = cellSize / 2;
						solutionCtx.font = `${cellSize / 1.5}px sans-serif`;
						for (let r = 0; r < 9; r++) {
							for (let c = 0; c < 9; c++) {
								const val = solvedGrid[r][c];
								const x = c * cellSize + halfCell;
								const y = r * cellSize + halfCell;

								if (val < 0) {
									solutionCtx.fillStyle = 'red';
									solutionCtx.fillText(Math.abs(val).toString(), x, y, cellSize);
								} else {
									solutionCtx.fillStyle = 'green';
									solutionCtx.fillText(val.toString(), x, y, cellSize);
								}
							}
						}
					} catch (err) {
						if (err instanceof UnsolvableGridError) {
							console.warn(err);
						} else {
							throw err;
						}
					}
				}
			}

			videoElement.requestVideoFrameCallback(updateCanvas);
		};

		videoElement.requestVideoFrameCallback(updateCanvas);
	});

	$: frameProcessor = loaded
		? new SudokuFrameProcessor(
				cv,
				canvasElement.width,
				canvasElement.height,
				new SudokuPredictor(digitsModel, orientationModel)
			)
		: null;

	$: videoElement && (videoElement.srcObject = $cameraStream);
	$: loaded = cv != null && digitsModel != null && orientationModel != null;
</script>

<OpenCvLoader on:loaded={(event) => (cv = event.detail)} />

<video bind:this={videoElement} hidden />
<canvas bind:this={canvasElement} id="output" class="w-full" />
<canvas bind:this={solutionElement} width="256" height="256" />
<!-- {#if solvedGrid != null}
	{#each solvedGrid as row, r}
		<span>
			{#each row as val, c}
				{#if val < 0}
					<b>{Math.abs(val)} </b>
				{:else}
					<span>{val} </span>
				{/if}
			{/each}
		</span>
		<br />
	{/each}
{/if} -->
{#if !loaded}
	<div class="text-center absolute text-primary text-lg">
		<span class="loading loading-spinner loading-lg" />
		<p>Loading</p>
	</div>
{/if}

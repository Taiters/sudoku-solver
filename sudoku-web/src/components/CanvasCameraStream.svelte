<script lang="ts">
	import { cameraStream } from '$lib/store';
	import { createEventDispatcher, onMount } from 'svelte';

	const dispatch = createEventDispatcher<{ frame: CanvasRenderingContext2D }>();

	let canvasElement: HTMLCanvasElement;
	let videoElement: HTMLVideoElement;

	onMount(async () => {
		const ctx = canvasElement.getContext('2d', { willReadFrequently: true });
		videoElement.onloadedmetadata = () => {
			videoElement.play();
			canvasElement.width = videoElement.videoWidth;
			canvasElement.height = videoElement.videoHeight;
		};

		const frameCallback: VideoFrameRequestCallback = async (now, metadata) => {
			if (ctx == null) {
				return;
			}

			ctx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
			dispatch('frame', ctx);
			videoElement.requestVideoFrameCallback(frameCallback);
		};

		videoElement.requestVideoFrameCallback(frameCallback);
	});

	$: videoElement && (videoElement.srcObject = $cameraStream);
</script>

<video bind:this={videoElement} hidden />
<canvas bind:this={canvasElement} class="w-full" />

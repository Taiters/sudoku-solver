<script context="module" lang="ts">
	export type LoadedResources = {
		cv: typeof openCV;
		tf: typeof tensorflow;
		digitsModel: LayersModel;
		orientationModel: LayersModel;
	};
</script>

<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import type openCV from 'opencv-ts';
	import type tensorflow from '@tensorflow/tfjs';
	import type { LayersModel } from '@tensorflow/tfjs';

	const SCRIPT_ID = 'opencv_script';
	const PATH = '/opencv.js';

	const dispatch = createEventDispatcher<{ loaded: LoadedResources }>();

	let cv: typeof openCV;
	let tf: typeof tensorflow;
	let digitsModel: LayersModel;
	let orientationModel: LayersModel;

	onMount(async () => {
		tf = await import('@tensorflow/tfjs');
		[digitsModel, orientationModel] = await Promise.all<LayersModel>([
			tf.loadLayersModel('/models/digits_9967_0100_1717968332/model.json'),
			tf.loadLayersModel('/models/orientations_9027_2061_1717970078/model.json')
		]);
	});

	if (!document.getElementById(SCRIPT_ID)) {
		const openCVScript = document.createElement('script');

		openCVScript.id = SCRIPT_ID;
		openCVScript.setAttribute('src', PATH);
		openCVScript.setAttribute('defer', '');
		openCVScript.setAttribute('type', 'text/javascript');

		openCVScript.onload = () => {
			cv = window.cv as typeof openCV;
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
		if (cv && tf && digitsModel && orientationModel) {
			waitUntilCVEvaluated(cv, () => {
				dispatch('loaded', {
					tf,
					cv,
					digitsModel,
					orientationModel
				});
			});
		}
	}
</script>

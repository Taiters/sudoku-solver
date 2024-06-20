<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type openCV from 'opencv-ts';

	const SCRIPT_ID = 'opencv_script';
	const PATH = '/opencv.js';

	if (!document.getElementById(SCRIPT_ID)) {
		const dispatch = createEventDispatcher<{ loaded: typeof openCV }>();

		const openCVScript = document.createElement('script');

		openCVScript.id = SCRIPT_ID;
		openCVScript.setAttribute('src', PATH);
		openCVScript.setAttribute('defer', '');
		openCVScript.setAttribute('type', 'text/javascript');

		openCVScript.onload = () => {
			// Seems there can be a delay between loaded and
			// things being available. Can check here to only fire
			// the event when Mat is available.
			function checkAndFireEvent() {
				const cv = window.cv as typeof openCV;
				if (cv.Mat) {
					dispatch('loaded', cv);
				} else {
					setTimeout(checkAndFireEvent, 1);
				}
			}

			checkAndFireEvent();
		};

		document.body.appendChild(openCVScript);
	}
</script>

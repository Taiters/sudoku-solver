<script>
	import { createEventDispatcher } from "svelte";

    const SCRIPT_ID = 'opencv_script';
    const PATH = '/opencv.js';

    if (!document.getElementById(SCRIPT_ID)) {
        const dispatch = createEventDispatcher();

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
                if (window.cv.Mat) {
                    dispatch('loaded');
                } else {
                    setTimeout(checkAndFireEvent, 1);
                }
            }

            checkAndFireEvent();
        }

        document.body.appendChild(openCVScript);
    }
</script>
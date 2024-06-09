<script>
	import { createEventDispatcher } from "svelte";

    if (!document.getElementById('opencv_script')) {
        const dispatch = createEventDispatcher();

        const openCVScript = document.createElement('script');

        openCVScript.id = 'opencv_script';
        openCVScript.setAttribute('defer', '');
        openCVScript.setAttribute('type', 'text/javascript');
        openCVScript.setAttribute('src', '/opencv.js');

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
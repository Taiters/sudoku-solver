<script lang="ts">
	import Video from '$components/Video.svelte';
	import Welcome from '$components/Welcome.svelte';
	import { cameraStream } from '$lib/store';
</script>

<div class="container center flex flex-col h-screen justify-center items-center">
	{#if $cameraStream}
		<Video />
	{:else}
		<Welcome />
	{/if}
</div>

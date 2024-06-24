<script lang="ts">
  import StreamRequestButton from "$components/StreamRequestButton.svelte";
  import FaGithub from "svelte-icons/fa/FaGithub.svelte";
</script>

<div class="container center flex flex-col h-screen justify-center items-center">
  <div class="grow flex flex-col center justify-center items-center">
    <h1 class="text-4xl font-bold">Sudoku Solver</h1>
    <p>Solve a sudoku puzzle with your camera</p>
    <StreamRequestButton />
  </div>
  <div class="mb-4">
    <a
      class="btn btn-ghost btn-circle"
      href="https://github.com/Taiters/sudoku-solver"
      target="_blank"
    >
      <div class="w-8 h-8">
        <FaGithub />
      </div>
    </a>
  </div>
</div>

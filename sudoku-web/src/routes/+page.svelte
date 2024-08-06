<script lang="ts">
  import StreamRequestButton from "$components/StreamRequestButton.svelte";
</script>

<h1 class="text-4xl font-bold">Sudoku Solver</h1>
<p>Solve a sudoku puzzle with your camera</p>
<StreamRequestButton />
<button class="link link-secondary" onclick="my_modal_3.showModal()">What's this?</button>
<dialog id="my_modal_3" class="modal">
  <div class="modal-box">
    <form method="dialog">
      <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
    </form>
    <h3 class="text-lg font-bold">Welcome to this Visual Sudoku Solver</h3>
    <p>This app lets you solve Sudoku puzzles by simply pointing your camera at them. It's a project I built to learn and experiment with computer vision and machine learning.</p>

    <h3 class="text-lg font-bold mt-4">How to use</h3>
    <ol class="list-decimal ml-4">
      <li>Point your camera at the Sudoku puzzle.</li>
      <li>Make sure the whole grid is visible in the camera frame.</li>
      <li>Hold still for a few seconds while the app works its magic and fills in the missing numbers.</li>
    </ol>

    <h3 class="text-lg font-bold mt-4">Tips for best results</h3>
    <ul class="list-disc ml-4">
      <li><strong>Lighting</strong><br/>Try to use even lighting. Avoid shadows or glare that might mess with the grid detection.</li>
      <li><strong>Angle</strong><br/>Hold your camera directly above the puzzle. Avoid tilting or weird angles.</li>
      <li><strong>Focus</strong><br/>Make sure the puzzle is in focus and the numbers are clear.</li>
    </ul>

    <h3 class="text-lg font-bold mt-4">Known issues</h3>
    <p>I built this mainly for my own learning, so it's definitely not perfect. Some more common issues are:</p>
    <ul class="list-disc ml-4">
      <li>Sometimes, the app has trouble recognizing the grid, especially if the lighting is uneven or the puzzle isn't clear.</li>
      <li>It might occasionally misread parts of the grid, leading to some errors.</li>
    </ul>

    <h3 class="text-lg font-bold mt-4">Learn more</h3>
    <p>If you'd like to learn more about how I built this, I documented a lot of the progress in python notebooks which are <a class="link" href="https://github.com/Taiters/sudoku-solver/tree/main/notebooks">available on Github</a>.</p>
  </div>
</dialog>

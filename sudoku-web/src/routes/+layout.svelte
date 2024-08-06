<script>
  import "../app.css";
  import FaGithub from "svelte-icons/fa/FaGithub.svelte";
</script>

<div class="container center flex flex-col h-screen justify-center items-center">
  <div class="grow flex flex-col center justify-center items-center">
    <slot />
  </div>
  <div class="mb-8 text-center">
    <a
      class="btn btn-ghost btn-circle"
      href="https://github.com/Taiters/sudoku-solver"
      target="_blank"
    >
      <div class="w-8 h-8">
        <FaGithub />
      </div>
    </a>
    <p>© {(new Date()).getFullYear()} Dan Tait - <a class="link" href="https://dotslashdan.com">dotslashdan.com</a></p>
  </div>
</div>

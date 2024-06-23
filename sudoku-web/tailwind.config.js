/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{html,js,svelte,ts}"],
  theme: {
    extend: {},
    container: {
      center: true,
    },
  },
  daisyui: {
    // TODO: Add a dark theme, but I like working with this for now
    themes: ["cupcake"],
  },
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  plugins: [require("daisyui")],
};

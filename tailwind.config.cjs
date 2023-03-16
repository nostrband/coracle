/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,svelte}"],
  safelist: ["w-4", "h-4"],
  theme: {
    extend: {},
    colors: {
      transparent: "var(--transparent)",
      black: "var(--black)",
      white: "var(--white)",
      accent: "var(--accent)",
      "accent-light": "var(--accent-light)",
      input: "var(--input)",
      "input-hover": "var(--input-hover)",
      "gray-0": "var(--gray-0)",
      "gray-1": "var(--gray-1)",
      "gray-2": "var(--gray-2)",
      "gray-3": "var(--gray-3)",
      "gray-4": "var(--gray-4)",
      "gray-5": "var(--gray-5)",
      "gray-6": "var(--gray-6)",
      "gray-7": "var(--gray-7)",
      "gray-8": "var(--gray-8)",
      "gray-9": "var(--gray-9)",
      danger: "var(--danger)",
      warning: "var(--warning)",
      success: "var(--success)",
    },
  },
  plugins: [],
}

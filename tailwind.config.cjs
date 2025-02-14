/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,svelte}"],
  darkMode: 'class',
  safelist: ["w-4", "h-4"],
  theme: {
    extend: {},
    zIndex: {
      none: 0,
      feature: 1,
      nav: 2,
      chat: 3,
      popover: 4,
      modal: 5,
      toast: 6,
    },
    screens: {
      xs: "400px",
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },
    colors: {
      black: "var(--black)",
      white: "var(--white)",
      transparent: "var(--transparent)",
      accent: "var(--accent)",
      "accent-l": "var(--accent-l)",
      "accent-d": "var(--accent-d)",
      warm: "var(--warm)",
      "warm-l": "var(--warm-l)",
      "warm-d": "var(--warm-d)",
      dark: "var(--dark)",
      "dark-l": "var(--dark-l)",
      "dark-d": "var(--dark-d)",
      mid: "var(--mid)",
      light: "var(--light)",
      lighter: "var(--lighter)",
      lightest: "var(--lightest)",
      cocoa: "var(--cocoa)",
      "cocoa-l": "var(--cocoa-l)",
      "cocoa-d": "var(--cocoa-d)",
      danger: "var(--danger)",
      warning: "var(--warning)",
      success: "var(--success)",
    },
  },
  plugins: [],
}

// Tailwind via PostCSS, as the bundled Next.js docs recommend. The scaffold's
// Turbopack CSS loader did not rebuild CSS on change in `next dev`.
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;

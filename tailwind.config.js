/** @type {import('tailwindcss').Config} */
module.exports = {
  // Paths to all component files.
  content: ["./src/app/**/*.{js,jsx,ts,tsx}", "./src/components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        logo: '#9457FF',
        icon: '#643EB2',
        backgroundTheme: '#000000',
        cardBg: '#141414',
        textPrimary: '#FAFAFA',
        textSecondary: '#A3A3A3',
        borderTheme: '#656565',
        yellowTheme: '#FDE047',
        redTheme: '#F87171',
        cyanTheme: '#22D3EE',
        greenTheme: '#4ADE80',
        grayTheme: '#D4D4D8',
      },
      fontFamily: {
        genos: ["Genos", "sans-serif"],
        inter: ["Inter", "sans-serif"],
        montserrat: ["Montserrat", "sans-serif"],
      }
    },
  },
  plugins: [],
}

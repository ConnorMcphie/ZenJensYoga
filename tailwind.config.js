/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**.{js,ts,jsx,tsx,mdx}", // Or make sure this path is correct
    ],
    theme: {
        extend: { // Make sure it's inside 'extend'
            fontFamily: {
                // Key is 'playfair', value is the array
                playfair: ['"Playfair Display"', 'serif'],
            },
        },
    },
    plugins: [],
}
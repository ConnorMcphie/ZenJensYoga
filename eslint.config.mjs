import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import typescriptParser from '@typescript-eslint/parser'; // Import the parser
import typescriptPlugin from '@typescript-eslint/eslint-plugin'; // Import the plugin

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
    baseDirectory: __dirname,
});

/** @type {import('eslint').Linter.FlatConfig[]} */
const eslintConfig = [
    ...compat.extends("next/core-web-vitals"), // Keep Next.js defaults

    // Add this section to configure TypeScript rules
    {
        files: ["**/*.ts", "**/*.tsx"], // Apply only to TypeScript files
        languageOptions: {
            parser: typescriptParser, // Use the TypeScript parser
            parserOptions: {
                project: "./tsconfig.json", // Point to your tsconfig
            },
        },
        plugins: {
            "@typescript-eslint": typescriptPlugin, // Add the TypeScript plugin
        },
        rules: {
            // Configure the no-unused-vars rule
            "@typescript-eslint/no-unused-vars": [
                "error", // Keep it as an error
                {
                    "argsIgnorePattern": "^_", // Ignore arguments starting with _
                    "varsIgnorePattern": "^_", // Ignore variables starting with _
                    "caughtErrorsIgnorePattern": "^_" // Ignore caught errors starting with _
                }
            ],
            // You can add other TypeScript-specific rules here if needed
        },
    },
];

export default eslintConfig;
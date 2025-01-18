import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true, // Enable global test APIs like `describe`, `it`, etc.
        environment: 'node',
        coverage: {
            reporter: ['text', 'html'],
            reportsDirectory: './coverage',
        },
    },
});

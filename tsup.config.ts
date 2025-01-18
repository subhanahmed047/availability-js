import { defineConfig } from 'tsup'

export default defineConfig({
    entry: ["src", "!src/__tests__/**", "!src/**/*.test.*"], // ignore the __tests__
    target: 'es2020',
    format: ['cjs', 'esm'],
    splitting: false,
    sourcemap: true,
    clean: true,
    dts: true,
})
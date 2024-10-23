import { defineConfig } from "vite"
import { libInjectCss } from "vite-plugin-lib-inject-css"
import { extname, relative, resolve } from "node:path"
import { glob } from "glob"
import { fileURLToPath } from "node:url"
import dts from "vite-plugin-dts"

export default defineConfig({
	plugins: [dts({ include: ["lib"] })],
	build: {
		sourcemap: true,
		copyPublicDir: false,
		emptyOutDir: false,
		lib: {
			entry: resolve(__dirname, "lib/main.ts"),
			formats: ["es"],
		},
		rollupOptions: {
			// make sure to externalize deps that shouldn't be bundled
			// into your library
			external: ["mithril"],
			output: {
				assetFileNames: "assets/[name][extname]",
				entryFileNames: "[name].js",
				globals: {
					mithril: "m",
				},
			},
			input: Object.fromEntries(
				glob
					.sync("lib/**/*.{ts,tsx}", {
						ignore: ["lib/**/*.d.ts"],
					})
					.map((file) => [
						// The name of the entry point lib/nested/foo.ts becomes nested/foo
						relative("lib", file.slice(0, file.length - extname(file).length)),
						// The absolute path to the entry file lib/nested/foo.ts becomes /project/lib/nested/foo.ts
						fileURLToPath(new URL(file, import.meta.url)),
					]),
			),
		},
	},
})

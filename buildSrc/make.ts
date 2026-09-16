import { rolldown } from "rolldown"

const bundle = await rolldown({
	input: {
		main: "./main.ts",
	},
	external: (name) => {
		const externalStyleImport = name.startsWith("@") && !name.startsWith("@tutao")
		return (
			externalStyleImport ||
			["commander", "zx", "fs", "fs-extra", "jiti", "zx/globals", "rollup", "rolldown", "jszip", "node:"].some((externalDependencyName) =>
				name.startsWith(externalDependencyName),
			)
		)
	},
	plugins: [],
	tsconfig: "./tsconfig.buildSrc.json",
})

await bundle.write({
	sourcemap: true,
	esModule: true,
	format: "esm",
	dir: "../build/buildSrc/",
})

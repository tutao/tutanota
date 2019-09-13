import path from "path"
import babelPlugin from "@rollup/plugin-babel"
import commonjs from "@rollup/plugin-commonjs"

const {babel} = babelPlugin

// These are the dependencies that must be provided for the module loader systemjs
export const dependencyMap = {
	"mithril": "./libs/mithril.js",
	"mithril/stream/stream.js": "./libs/stream.js",
	"squire-rte": "./libs/squire-raw.js",
	"bluebird": "./libs/bluebird.js",
	"dompurify": "./libs/purify.js",
	"autolinker": "./libs/Autolinker.js",
	"qrcode": "./libs/qrcode.js",
	"jszip": "./libs/jszip.js",
	"luxon": "./libs/luxon.js",
}

export function resolveLibs(baseDir = ".") {
	return {
		name: "resolve-libs",
		resolveId(source) {
			const resolved = dependencyMap[source]
			return resolved && path.join(baseDir, resolved)
		}
	}
}

export function rollupDebugPlugins(baseDir) {
	return [
		babel({
			plugins: [
				// Using Flow plugin and not preset to run before class-properties and avoid generating strange property code
				"@babel/plugin-transform-flow-strip-types",
				"@babel/plugin-proposal-class-properties",
				"@babel/plugin-syntax-dynamic-import"
			],
			sourceMaps: true,
		}),
		resolveLibs(baseDir),
		commonjs({
			exclude: ["src/**"],
			// include: ["libs/**"],
			sourceMap: false,
		}),
	]
}
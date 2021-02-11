import pluginBabel from "@rollup/plugin-babel"
import commonjs from "@rollup/plugin-commonjs"
import path from "path"
import Promise from "bluebird"
import fs from "fs-extra"
import {dependencyMap} from "./RollupConfig.js";

const {babel} = pluginBabel

function resolveLibs(baseDir = ".") {
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
			inputSourceMap: false,
			babelHelpers: "bundled",
			retainLines: true,
		}),
		resolveLibs(baseDir),
		commonjs({
			exclude: ["src/**"],
			// nollup sometimes creates empty synthetic modules for node built-ins resulting in
			// errors like Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'crypto?commonjs-require'
			// adding the module here will fix that
			ignore: ["util", "crypto"],
			// This is for the cases when es module is imported from commonjs module.
			// "auto" will try to wrap into namespace, "preferred" will try to use default export as a namespace which is something that
			// we want in most cases.
			requireReturnsDefault: "preferred",
		}),
	]
}

export async function writeNollupBundle(generatedBundle, log, dir = "build") {
	await fs.mkdirp(dir)
	return Promise.map(generatedBundle.output, async (o) => {
		const filePath = path.join(dir, o.fileName)
		// log("Writing", filePath)
		return fs.writeFile(filePath, o.code || o.source)
	})
}

/**
 * Small plugin to resolve builtins in node.
 * @rollup/plugin-node-resolve also resolves from node_modules which is *not* something that we want to do automatically because we want
 * to vendor third-party libraries.
 */
export function resolveDesktopDeps() {
	return {
		name: "node-resolve",
		resolveId(id) {
			switch (id) {
				case "fs":
				case "path":
				case "electron":
				case "child_process":
				case "os":
				case "url":
				case "util":
				case "crypto":
					return false
			}
		}
	}
}
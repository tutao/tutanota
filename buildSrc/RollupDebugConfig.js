// file: keeping it for admin client right now

import typescript from "@rollup/plugin-typescript"
import commonjs from "@rollup/plugin-commonjs"
import path from "node:path"
import fs from "fs-extra"
import { dependencyMap } from "./RollupConfig"

export function resolveLibs(baseDir = ".") {
	return {
		name: "resolve-libs",
		resolveId(source) {
			const resolved = dependencyMap[source]
			return resolved && path.join(baseDir, resolved)
		},
	}
}

export function rollupDebugPlugins(baseDir, tsOptions) {
	return [
		typescript({
			tsconfig: "tsconfig.json",
			// We need this so that we include files which are not in our cwd() (like tests which import stuff from "..")
			filterRoot: baseDir,
			...tsOptions,
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
			ignoreDynamicRequires: true,
		}),
	]
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
		},
	}
}

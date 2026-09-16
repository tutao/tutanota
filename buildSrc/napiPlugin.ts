import path from "node:path"
import { getTargetTupleWithLibc, removeNpmNamespacePrefix, resolveArch } from "./buildUtils.js"
import fs from "node:fs"
import { OutputOptions as RollupOutputOptions, PluginContext as RollupPluginContext } from "rollup"

/**
 * Copies module that was already built with napi-rs.
 * Assumes that the .node file resides next to the entry point dictated by the "main" in package.json.
 * Assumes that the file name contains platform triple.
 */
type NapiPluginOpts = {
	modulePath: string
	platform: NodeJS.Platform
	architecture: NodeJS.Architecture | "universal"
}
export function napiPlugin({ modulePath, platform, architecture }: NapiPluginOpts) {
	return {
		name: "napiPlugin",
		async writeBundle(this: RollupPluginContext, opts: RollupOutputOptions) {
			const moduleName = removeNpmNamespacePrefix(modulePath)
			modulePath = path.join(path.resolve(modulePath), "/napi-out")
			for (let arch of resolveArch(architecture)) {
				const targetTuple = getTargetTupleWithLibc(platform, arch)
				const fileName = `${moduleName}.${targetTuple}.node`
				const normalizedDstDir = path.normalize(opts.dir!)
				await fs.promises.mkdir(normalizedDstDir, { recursive: true })
				await fs.promises.copyFile(path.join(modulePath, fileName), path.join(normalizedDstDir, fileName))
			}
		},
	}
}

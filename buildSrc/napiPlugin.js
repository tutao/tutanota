import path from "node:path"
import { removeNpmNamespacePrefix } from "./buildUtils.js"
import fs from "node:fs"

/**
 * Copies module that was already built with napi-rs.
 * Assumes that the .node file resides next to the entry point dictated by the "main" in package.json.
 * Assumes that the file name contains platform triple.
 */
export function napiPlugin({ nodeModule, platform, architecture }) {
	return {
		name: "napiPlugin",
		async writeBundle(opts) {
			const resolvedModulePath = await this.resolve(nodeModule)
			if (resolvedModulePath == null) {
				return this.error(`Could not resolve module ${nodeModule}`)
			}
			const modulePath = path.dirname(resolvedModulePath.id)
			const moduleName = removeNpmNamespacePrefix(nodeModule)
			for (let arch of resolveArch(architecture)) {
				const targetTriple = getTargetTriple(platform, arch)
				const fileName = `${moduleName}.${targetTriple}.node`
				const normalizedDstDir = path.normalize(opts.dir)
				await fs.promises.mkdir(normalizedDstDir, { recursive: true })
				await fs.promises.copyFile(path.join(modulePath, fileName), path.join(normalizedDstDir, fileName))
			}
		},
	}
}

function resolveArch(arch) {
	if (arch === "universal") {
		return ["x64", "arm64"]
	} else {
		return [arch]
	}
}

/**
 * napi appends abi to the architecture (see https://napi.rs/docs/cli/napi-config)
 */
function getTargetTriple(platform, architecture) {
	if (platform === "linux") {
		return `${platform}-${architecture}-gnu`
	} else if (platform === "win32") {
		return `${platform}-${architecture}-msvc`
	} else {
		return `${platform}-${architecture}`
	}
}

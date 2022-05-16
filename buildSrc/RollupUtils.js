import {dependencyMap} from "./RollupConfig.js"
import path from "path"
import fs from "fs/promises"

export function resolveLibs(baseDir = ".") {
	return {
		name: "resolve-libs",
		resolveId(source) {
			const resolved = dependencyMap[source]
			return resolved && path.join(baseDir, resolved)
		}
	}
}

export async function writeNollupBundle(generatedBundle, log, dir = "build") {
	await fs.mkdir(dir, {recursive: true})

	return Promise.all(generatedBundle.output.map((o) => {
		const filePath = path.join(dir, o.fileName)
		// log("Writing", filePath)
		return fs.writeFile(filePath, o.code || o.source)
	}))
}
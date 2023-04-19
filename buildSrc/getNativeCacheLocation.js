import fs from "node:fs/promises"
import { buildCachedLibPath } from "./nativeLibraryProvider.js"

const packageJson = JSON.parse(await fs.readFile("package-lock.json", "utf-8"))
const module = process.argv[2]
// we have a git commit as a version in dependencies, we want the actually resolved version number
const version = packageJson.packages[`node_modules/${module}`].version
console.log(
	await buildCachedLibPath({
		rootDir: "test",
		platform: "linux",
		environment: "node",
		versionedEnvironment: "node",
		nodeModule: module,
		libraryVersion: version,
		architecture: process.arch,
	}),
)

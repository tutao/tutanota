/**
 * this script finds a given native modules version as found in package-lock.json and
 * outputs the path where a cached build would be expected to stdout.
 * We can then restore that path from cache.
 *
 * This is useful in CI to know the location of the build before
 * we install the dependencies and rebuild from scratch.
 * (see .github/workflows/test.yml)
 * */
import fs from "node:fs/promises"
import { buildCachedLibPaths } from "./nativeLibraryProvider.js"

const packageJson = JSON.parse(await fs.readFile("package-lock.json", "utf-8"))
const module = process.argv[2]
// we have a git commit as a version in dependencies, we want the actually resolved version number
const version = packageJson.packages[`node_modules/${module}`].version
console.log(
	await buildCachedLibPaths({
		rootDir: "test",
		platform: "linux",
		environment: "node",
		versionedEnvironment: `node-${process.versions.modules}`,
		nodeModule: module,
		libraryVersion: version,
		architecture: process.arch,
	}),
)

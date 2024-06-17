#! /bin/env node

import path, { dirname } from "node:path"
import fs from "node:fs"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))

const vendoredVersions = JSON.parse(fs.readFileSync(path.join(__dirname, "../libs/", "vendored-versions.json")))
const packageJsonVersions = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "package.json"))).dependencies

for (const vendoredLibName of Object.keys(vendoredVersions)) {
	const definedVersion = packageJsonVersions[vendoredLibName]
	const vendoredVersion = vendoredVersions[vendoredLibName]
	if (definedVersion !== vendoredVersion) {
		console.error(
			`Vendored version mismatch: ${vendoredLibName} should be ${definedVersion} but is ${vendoredVersion}. \n\n Forgot to run buildSrc/updateLibs.js ?`,
		)
		process.exit(1)
	}
}

console.log("all vendored versions are in sync")

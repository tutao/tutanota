import fs from "node:fs"
import { program } from "commander"
import { fileURLToPath } from "node:url"
import "zx/globals"
import path from "node:path"

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	program.usage("make|dist").arguments("<target>").action(prepareMobileBuild).parse(process.argv)
}

/**
 * Removes source maps, icons, HTML files which are not needed for mobile apps.
 */
export async function prepareMobileBuild(buildType, app) {
	console.log("prepare mobile build for build type", buildType)
	let prefix
	if (["dist", "make"].includes(buildType)) {
		prefix = app === "mail" ? "build/" : "build-calendar-app/"
	} else {
		throw new Error("Unknown build type " + buildType)
	}

	const wasmpath = prefix + "wasm"
	if (fs.existsSync(wasmpath)) {
		console.log("unlinking ", wasmpath)
		fs.rmSync(wasmpath, { force: true, recursive: true })
	}

	// remove source map
	for (let file of fs.readdirSync(prefix)) {
		if (file.endsWith(".js.map")) {
			console.log("unlinking ", file)
			fs.unlinkSync(path.join(prefix, file))
		}
	}

	const indexHtmlPath = prefix + "index.html"
	if (fs.existsSync(indexHtmlPath)) {
		fs.unlinkSync(indexHtmlPath)
		console.log("rm ", indexHtmlPath)
	} else {
		console.log("no file at", indexHtmlPath)
	}
}

import fs from "node:fs"
import { program } from "commander"
import { glob } from "glob"
import { fileURLToPath } from "node:url"
import "zx/globals"

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

	const imagesPath = prefix + "images"
	const imagesToKeep = ["font.ttf", "logo-solo-red.png"]
	if (fs.existsSync(imagesPath)) {
		const imageFiles = await globby(prefix + "images/*")
		for (let file of imageFiles) {
			const doDiscard = !imagesToKeep.some((name) => file.endsWith(name))
			if (doDiscard) {
				console.log("unlinking ", file)
				fs.unlinkSync(file)
			}
		}
	} else {
		console.log("No folder at", imagesPath)
	}

	const maps = glob.sync(prefix + "*.js.map")
	for (let file of maps) {
		console.log("unlinking ", file)
		fs.unlinkSync(file)
	}
	const indexHtmlPath = prefix + "index.html"
	if (fs.existsSync(indexHtmlPath)) {
		fs.unlinkSync(indexHtmlPath)
		console.log("rm ", indexHtmlPath)
	} else {
		console.log("no file at", indexHtmlPath)
	}
}

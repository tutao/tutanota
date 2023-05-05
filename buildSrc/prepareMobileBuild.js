import fs from "node:fs"
import { program } from "commander"
import glob from "glob"
import { fileURLToPath } from "node:url"
import "zx/globals"

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	program.usage("make|dist").arguments("<target>").action(prepareMobileBuild).parse(process.argv)
}

/**
 * Removes source maps, icons, HTML files which are not needed for mobile apps.
 */
export async function prepareMobileBuild(buildType) {
	console.log("prepare mobile build for build type", buildType)
	let prefix
	switch (buildType) {
		case "dist":
			prefix = "build/dist/"
			break
		case "make":
			prefix = "build/"
			break
		default:
			throw new Error("Unknown build type " + buildType)
	}

	const imagesPath = prefix + "images"
	const imagesToKeep = ["font.ttf", "logo-solo-red.png"]
	if (fs.existsSync(imagesPath)) {
		const imageFiles = await globby(prefix + "images/*")
		for (let file of imageFiles) {
			const doDiscard = !imagesToKeep.find((name) => file.endsWith(name))
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

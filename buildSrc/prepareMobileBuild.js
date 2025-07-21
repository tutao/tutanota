import fs from "node:fs"
import { Option, program } from "commander"
import { fileURLToPath } from "node:url"
import path from "node:path"

const TAG = "prepareMobileBuild:"

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	program
		.description("Prepare built web code for mobile app build")
		.addOption(new Option("--app <app>", "which app to prepare build for").choices(["mail", "calendar"]))
		.parse(process.argv)
	await prepareMobileBuild(program.opts())
}

/**
 * Removes source maps, icons, HTML files which are not needed for mobile apps.
 * @param opts {object}
 * @param opts.app {"mail"|"calendar"}
 */
export async function prepareMobileBuild({ app }) {
	if (app !== "mail" && app !== "calendar") {
		throw new Error("Required option app: " + app)
	}
	console.log(TAG, "prepare mobile build for app", app)
	const prefix = app === "mail" ? "build/" : "build-calendar-app/"
	if (!fs.existsSync(prefix)) {
		throw new Error(`Prefix dir does not exist, likely an error!: ${prefix}`)
	}

	removeWasm(prefix)
	removeSourceMaps(prefix)

	const indexHtmlPath = prefix + "index.html"
	if (fs.existsSync(indexHtmlPath)) {
		fs.unlinkSync(indexHtmlPath)
		console.log(TAG, "rm", indexHtmlPath)
	} else {
		console.log(TAG, "no file at", indexHtmlPath)
	}
}

/** @param prefix {string} */
function removeWasm(prefix) {
	const wasmpath = path.join(prefix, "wasm")
	if (fs.existsSync(wasmpath)) {
		console.log(TAG, "rm", wasmpath)
		fs.rmSync(wasmpath, { force: true, recursive: true })
	}
}

/** @param prefix {string} */
function removeSourceMaps(prefix) {
	for (let file of fs.readdirSync(prefix)) {
		if (file.endsWith(".js.map")) {
			console.log(TAG, "rm", file)
			fs.unlinkSync(path.join(prefix, file))
		}
	}
}

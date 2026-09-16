import fs from "node:fs"
import { Command, Option } from "commander"
import path from "node:path"
import { AppName, buildDirForApp } from "./DevBuild"

const TAG = "prepareMobileBuild:"

export const prepareMobileBuildCmd = new Command("prepare-mobile-build")
	.description("Prepare built web code for mobile app build")
	.addOption(new Option("--app <app>", "which app to prepare build for").choices(["mail", "calendar", "drive"]))
	.parse(process.argv)
	.action(prepareMobileBuild)

/**
 * Removes source maps, icons, HTML files which are not needed for mobile apps.
 */
export async function prepareMobileBuild(app: AppName) {
	if (app !== "mail" && app !== "calendar" && app !== "drive") {
		throw new Error("Required option app: " + app)
	}
	console.log(TAG, "prepare mobile build for app", app)
	const prefix = buildDirForApp(app)
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

function removeWasm(prefix: string) {
	const wasmpath = path.join(prefix, "wasm")
	if (fs.existsSync(wasmpath)) {
		console.log(TAG, "rm", wasmpath)
		fs.rmSync(wasmpath, { force: true, recursive: true })
	}
}

function removeSourceMaps(prefix: string) {
	for (let file of fs.readdirSync(prefix)) {
		if (file.endsWith(".js.map")) {
			console.log(TAG, "rm", file)
			fs.unlinkSync(path.join(prefix, file))
		}
	}
}

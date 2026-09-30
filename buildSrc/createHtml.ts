/**
 * Utility to create the HTML landing page for the app.
 */
import fs from "fs-extra"
import { renderHtml } from "./LaunchHtml"
import { mkdir } from "node:fs/promises"
import path from "node:path"
import { AppName, buildDirForApp } from "./DevBuild"
import { EnvType } from "../src/platform-kit/app-env"

/**
 *
 * @param env Object with the following keys:
 * 	mode: String of value "App" or "Desktop" or "Browser"
 * 	dist: Boolean
 * 	staticUrl: String defining app base url for non-production environments and the native clients.
 * 	versionNumber: String containing the app's version number
 * @param app App to be built, defaults to mail app {String}
 * @returns {Promise<Awaited<void>[]>}
 */
export async function createHtml(env: EnvType, app: AppName = "mail") {
	let jsFileName: string
	let htmlFileName: string
	const buildDir = buildDirForApp(app)
	switch (env.mode) {
		case "App":
			jsFileName = "index-app.js"
			htmlFileName = "index-app.html"
			break
		case "Browser":
			jsFileName = "index.js"
			htmlFileName = "index.html"
			break
		case "Desktop":
			jsFileName = "index-desktop.js"
			htmlFileName = "index-desktop.html"
			break
		default:
			throw new Error("unexpected mode")
	}
	// We need to import bluebird early as it Promise must be replaced before any of our code is executed
	const imports = [{ src: "polyfill.js" }, { src: jsFileName }]
	let indexTemplate = await fs.readFile("./buildSrc/index.template.js", "utf8")

	const index = `window.whitelabelCustomizations = null
window.env = ${JSON.stringify(env, null, 2)}
${indexTemplate}`
	return Promise.all([
		_writeFile(`./${buildDir}/${jsFileName}`, index),
		renderHtml(imports, env).then((content) => _writeFile(`./${buildDir}/${htmlFileName}`, content)),
	])
}

async function _writeFile(targetFile: string, content: string) {
	await mkdir(path.dirname(targetFile), { recursive: true })
	await fs.writeFile(targetFile, content, "utf-8")
}

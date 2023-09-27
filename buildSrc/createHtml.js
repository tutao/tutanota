/**
 * Utility to create the HTML landing page for the app.
 */
import fs from "fs-extra"
import { renderHtml } from "./LaunchHtml.js"
import { mkdir } from "node:fs/promises"
import path from "node:path"

/**
 *
 * @param env Object with the following keys:
 * 	mode: String of value "App" or "Desktop" or "Browser"
 * 	dist: Boolean
 * 	staticUrl: String defining app base url for non-production environments and the native clients.
 * 	versionNumber: String containing the app's version number
 * @returns {Promise<Awaited<void>[]>}
 */
export async function createHtml(env) {
	let jsFileName
	let htmlFileName
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
	}
	// We need to import bluebird early as it Promise must be replaced before any of our code is executed
	const imports = [{ src: "polyfill.js" }, { src: jsFileName }]
	const indexTemplate = await fs.readFile("./buildSrc/index.template.js", "utf8")

	const index = `window.whitelabelCustomizations = null
window.env = ${JSON.stringify(env, null, 2)}
${indexTemplate}`
	return Promise.all([_writeFile(`./build/${jsFileName}`, index), renderHtml(imports, env).then((content) => _writeFile(`./build/${htmlFileName}`, content))])
}

async function _writeFile(targetFile, content) {
	await mkdir(path.dirname(targetFile), { recursive: true })
	await fs.writeFile(targetFile, content, "utf-8")
}

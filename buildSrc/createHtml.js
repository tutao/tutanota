/**
 * Utility to create the HTML landing page for the app.
 */
import fs from "fs-extra"
import { renderHtml } from "./LaunchHtml.js"
import { mkdir } from "node:fs/promises"
import path from "node:path"
import { buildDirForApp } from "./DevBuild.js"

/**
 *
 * @param env {import("../src/platform-kit/app-env/Env.ts").EnvType}
 * @param app {"mail"|"calendar"|"drive"} App to be built, defaults to mail app {String}
 * @returns {Promise<Awaited<void>[]>}
 */
export async function createHtml(env, app = "mail") {
	let jsFileName
	let htmlFileName
	const buildDir = buildDirForApp(app)
	switch (env.mode) {
		case "Ios":
		case "Android":
			jsFileName = "index-app.js"
			htmlFileName = "index-app.html"
			break
		case "Browser":
			jsFileName = "index.js"
			htmlFileName = "index.html"
			break
		case "Linux":
		case "Win32":
		case "Darwin":
			jsFileName = "index-desktop.js"
			htmlFileName = "index-desktop.html"
	}
	// We need to import bluebird early as it Promise must be replaced before any of our code is executed
	const imports = [{ src: "polyfill.js" }, { src: jsFileName }]
	let indexTemplate = await fs.readFile("./buildSrc/index.template.js", "utf8")

	const index = `globalThis.whitelabelCustomizations = null
globalThis.env = ${JSON.stringify(env, null, 2)}
${indexTemplate}`
	return Promise.all([
		_writeFile(`./${buildDir}/${jsFileName}`, index),
		renderHtml(imports, env).then((content) => _writeFile(`./${buildDir}/${htmlFileName}`, content)),
	])
}

async function _writeFile(targetFile, content) {
	await mkdir(path.dirname(targetFile), { recursive: true })
	await fs.writeFile(targetFile, content, "utf-8")
}

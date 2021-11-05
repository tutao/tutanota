import path from "path"
import {BuildServerClient} from "@tutao/tutanota-build-server"
import {fetchDictionaries} from "./DictionaryFetcher.js"
import fs from "fs-extra"

export async function runDevBuild({stage, host, desktop, clean, watch, serve}) {

	if (clean) {
		console.log("cleaning build dir")
		fs.emptyDir("build")
	}

	let buildServerOptions = {
		forceRestart: typeof (clean) !== "undefined" ? clean : false,
		builderPath: path.resolve("./buildSrc/Builder.js"),
		preserveLogs: true,
		autoRebuild: typeof (watch) !== "undefined" ? watch : false,
		buildOpts: {
			desktop, stage, host, clean
		},
		watchFolders: [path.resolve("src")]
	}

	if (serve) {
		buildServerOptions.devServerPort = 9001
		buildServerOptions.webRoot = path.resolve('build')
		buildServerOptions.spaRedirect = true
	}

	const buildServerClient = new BuildServerClient("make")
	await buildServerClient.buildWithServer(buildServerOptions)

	const dictPath = "build/dictionaries"
	if (!fs.existsSync(dictPath)) {
		const {devDependencies} = JSON.parse(await fs.readFile("package.json", "utf8"))
		await fetchDictionaries(devDependencies.electron, [dictPath])
	}
}
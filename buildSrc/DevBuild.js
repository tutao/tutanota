import path from "path"
import {BuildServerClient} from "@tutao/tutanota-build-server"
import {fetchDictionaries} from "./DictionaryFetcher.js"
import fs from "fs-extra"

export async function runDevBuild({stage, host, desktop, clean, watch, serve}) {

	if (clean) {
		console.log("cleaning build dir")
		fs.emptyDir("build")
	}

	const doClean = clean ?? false

	const buildServerOptions = {
		forceRestart: doClean,
		builderPath: path.resolve("./buildSrc/Builder.js"),
		preserveLogs: true,
		autoRebuild: watch ?? false,
		watchFolders: [path.resolve("src")]
	}

	const buildOpts = {
		desktop: desktop ?? false,
		stage: stage ?? "local",
		host,
		clean: doClean
	}

	if (serve) {
		buildServerOptions.devServerPort = 9001
		buildServerOptions.webRoot = path.resolve('build')
		buildServerOptions.spaRedirect = true
	}

	const buildServerClient = new BuildServerClient("make")
	await buildServerClient.buildWithServer(buildServerOptions, buildOpts)

	const dictPath = "build/dictionaries"
	if (!fs.existsSync(dictPath)) {
		const {devDependencies} = JSON.parse(await fs.readFile("package.json", "utf8"))
		await fetchDictionaries(devDependencies.electron, [dictPath])
	}
}
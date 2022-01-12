import path from "path"
import {fetchDictionaries} from "./DictionaryFetcher.js"
import fs from "fs-extra"
import {build} from "./Builder.js"
import {BuildServerClient} from "@tutao/tutanota-build-server"

export async function runDevBuild({stage, host, desktop, clean, watch, serve}) {

	if (clean) {
		console.log("cleaning build dir")
		await fs.emptyDir("build")
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
	}

	if (serve) {
		buildServerOptions.devServerPort = 9001
		buildServerOptions.webRoot = path.resolve('build')
		buildServerOptions.spaRedirect = true
	}

	const buildServerClient = new BuildServerClient("make")
	await buildServerClient.buildWithServer(buildServerOptions, buildOpts)
	// await buildWithoutServer(buildOpts, buildServerOptions)

	const dictPath = "build/dictionaries"
	if (!fs.existsSync(dictPath)) {
		const {dependencies} = JSON.parse(await fs.readFile("package.json", "utf8"))
		await fetchDictionaries(dependencies.electron, [dictPath])
	}
}

async function buildWithoutServer(buildOptions, serverOptions) {
	const bundleWrappers = await build(buildOptions, serverOptions, console.log.bind(console))
	for (const wrapper of bundleWrappers) {
		await wrapper.generate()
	}
}
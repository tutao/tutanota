import child_process from "child_process"
import {BuildServerClient} from "@tutao/tutanota-build-server"
import path from "path"
import {build} from "./TestBuilder.js"

run()

async function run() {
	let project
	if (process.argv.indexOf("api") !== -1) {
		project = "api"
	} else if (process.argv.indexOf("client") !== -1) {
		project = "client"
	} else {
		console.error("must provide 'api' or 'client' to run the tests")
		process.exit(1)
	}
	const clean = process.argv.includes("-c")


	try {
		const buildServerClient = new BuildServerClient("test")
		const buildServerOpts = {
			forceRestart: clean,
			builderPath: path.resolve("TestBuilder.js"),
			watchFolders: [path.resolve("api"), path.resolve("client"), path.resolve("../src")],
			autoRebuild: false
		}
		const buildOpts = {clean: false, stage: null, host: null}
		await buildServerClient.buildWithServer(buildServerOpts, buildOpts)
		// await buildWithoutServer(buildOpts, buildServerOpts)
		console.log("build finished!")
		const code = await runTest(project)
		process.exit(code)
	} catch (e) {
		console.error("Build failed", e)
		process.exit(1)
	}
}

async function buildWithoutServer(buildOptions, serverOptions) {
	const bundleWrappers = await build(buildOptions, serverOptions, console.log.bind(console))
	await bundleWrappers[0].generate()
}

function runTest(project) {
	return new Promise((resolve) => {
		let testRunner = child_process.fork(`./build/bootstrapTests-${project}.js`)
		testRunner.on('exit', (code) => {
			resolve(code)
		})
	})
}

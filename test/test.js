import Promise from "bluebird"
import child_process, {spawn} from "child_process"
import {BuildServerClient} from "@tutao/tutanota-build-server"
import flow from "flow-bin"
import path from "path"

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


	spawn(flow, ["--quiet"], {stdio: "inherit"})

	try {
		const buildServerClient = new BuildServerClient("test")
		await buildServerClient.buildWithServer({
			forceRestart: clean,
			builder: path.resolve("TestBuilder.js"),
			watchFolders: [path.resolve("api"), path.resolve("client"), path.resolve("../src")],
			buildOpts: {}
		})
		console.log("build finished!")
		const code = await runTest(project)
		process.exit(code)
	} catch (e) {
		console.error("Build failed", e)
		process.exit(1)
	}
}

function runTest(project) {
	return new Promise((resolve) => {
		let testRunner = child_process.fork(`./build/bootstrapTests-${project}.js`)
		testRunner.on('exit', (code) => {
			resolve(code)
		})
	})
}

async function directoryExists(filePath) {
	return fs.stat(filePath)
	         .then(stats => stats.isDirectory())
	         .catch(() => false)
}

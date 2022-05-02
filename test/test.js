import child_process from "child_process"
import {runTestBuild} from "./TestBuilder.js"
import {getTutanotaAppVersion} from "../buildSrc/buildUtils.js"

await run()

async function run() {
	console.log("testing version:", getTutanotaAppVersion())

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
		await runTestBuild({clean})
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
		let testRunner = child_process.fork(`./build/${project}/bootstrapTests-${project}.js`)
		testRunner.on('exit', (code) => {
			resolve(code)
		})
	})
}

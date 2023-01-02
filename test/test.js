import child_process from "child_process"
import { runTestBuild } from "./TestBuilder.js"
import { Option, program } from "commander"

await program
	.addOption(new Option("-i, --integration", "Include integration tests (requires local server)"))
	.addOption(new Option("-c, --clean"))
	.action(async ({ clean, integration }) => {
		await runTestBuild({ clean })
		console.log("build finished!")

		await runTestsAndExit(integration)
	})
	.parseAsync(process.argv)

/** Function which runs tests and exits with the exit code afterwards. */
async function runTestsAndExit(integration) {
	const code = await runTest(integration)
	process.exit(code)
}

function runTest(integration) {
	return new Promise((resolve) => {
		console.log("running tests")
		const args = integration ? ["-i"] : []
		// We fork because ospec is very weird and doesn't just let you wait for the results unless you do something with report
		const testProcess = child_process.fork(`./build/bootstrapTests.js`, args)
		testProcess.on("exit", resolve)
	})
}

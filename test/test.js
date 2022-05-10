import child_process from "child_process"
import {runTestBuild} from "./TestBuilder.js"
import {Argument, Option, program} from "commander"

await program
	.addArgument(new Argument("project")
		.choices(["api", "client"])
		.argOptional()
	)
	.addOption(new Option("-i, --integration", "Include integration tests (requires local server)"))
	.addOption(new Option("-c, --clean"))
	.action(async (project, {clean, integration}) => {
		await runTestBuild({clean})
		console.log("build finished!")

		const testProjects = project ? [project] : ["api", "client"]
		await runTestsAndExit(testProjects, integration)
	})
	.parseAsync(process.argv)

/** Function which runs tests for {@param projects} and exits with the most suitable code afterwards. */
async function runTestsAndExit(projects, integration) {
	const codes = []
	for (const project of projects) {
		codes.push(await runTest(project, integration))
	}
	const code = codes.find((code) => code !== 0) ?? 0
	process.exit(code)
}

function runTest(project, integration) {
	return new Promise((resolve) => {
		console.log("running", project, "tests")
		const args = integration ? ["-i"] : []
		// We fork because ospec is very weird and doesn't just let you wait for the results unless you do something with report
		const testProcess = child_process.fork(`./build/${project}/bootstrapTests-${project}.js`, args)
		testProcess.on('exit', resolve)
	})
}

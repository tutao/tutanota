import { runTestBuild } from "./TestBuilder.js"
import { Option, program } from "commander"

await program
	.addOption(new Option("-i, --integration", "Include integration tests (requires local server)"))
	.addOption(new Option("-c, --clean"))
	.addOption(new Option("-f, --filter <query>", "Filter for tests and specs to run only matching tests"))
	.addOption(new Option("--no-run", "Do not run the tests"))
	.action(async ({ clean, integration, filter, run }) => {
		await runTestBuild({ clean })
		console.log("build finished!")
		if (run) {
			await runTestsAndExit({ integration, filter })
		}
	})
	.parseAsync(process.argv)

/** Function which runs tests and exits with the exit code afterwards. */
async function runTestsAndExit({ integration, filter }) {
	const { run } = await import("./build/testInNode.js")
	const result = await run({ integration, filter })
	if (result.failingTests.length) {
		process.exit(1)
	} else {
		process.exit(0)
	}
}

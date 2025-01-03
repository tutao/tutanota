import { runTestBuild } from "./TestBuilder.js"
import { Option, program } from "commander"

await program
	.addOption(new Option("-i, --integration", "Include integration tests (requires local tutadb server)"))
	.addOption(new Option("-c, --clean"))
	.addOption(new Option("-f, --filter <query>", "Filter for tests and specs to run only matching tests"))
	.addOption(new Option("--no-run", "Do not run the tests in node"))
	.addOption(new Option("-br, --browser", "Start the web server and run the tests in browser").default(false))
	.addOption(new Option("--browser-cmd <path>", "Command used to run the browser").default("xdg-open"))
	.action(async ({ clean, integration, filter, run, browser, browserCmd }) => {
		await runTestBuild({ clean, exclude: !run ? ["node-mimimi"] : [] })
		console.log("build finished!")

		let nodeOk
		if (run) {
			nodeOk = await runTestsInNode({ integration, filter })
		} else {
			nodeOk = true
		}

		let browserOk
		if (browser) {
			browserOk = await runTestsInBrowser({ filter, browserCmd })
		} else {
			browserOk = true
		}

		if (browserOk && nodeOk) {
			process.exit(0)
		} else {
			process.exit(1)
		}
	})
	.parseAsync(process.argv)

function resultIsOk(result) {
	return result.failingTests.length === 0
}

/** Function which runs tests and exits with the exit code afterwards. */
async function runTestsInBrowser({ filter, browserCmd }) {
	const { default: express } = await import("express")
	const app = express()
	app.use(express.static("build"))
	// deafault limit (100Kb) is way too small
	app.use(express.json({ limit: "10Mb" }))

	const { spawn } = await import("node:child_process")

	const server = await new Promise((resolve) => {
		const s = app.listen(0, () => resolve(s))
	})

	const result = await new Promise((resolve) => {
		app.post("/status", (req, res) => {
			console.log("browser: ", req.body)
			res.status(200).send()
		})
		app.post("/result", (req, res) => {
			resolve(req.body)
			res.status(200).send()
		})

		const url = new URL(`http://localhost:${server.address().port}/test.html`)
		if (filter) {
			url.searchParams.set("filter", filter)
		}

		const command = `${browserCmd} '${url.toString()}'`
		console.log(`> ${command}`)
		spawn(command, { stdio: "inherit", shell: true })
	})

	const { default: o } = await import("@tutao/otest")
	console.log("\n--------------- BROWSER ---------------")
	o.printReport(result)
	return resultIsOk(result)
}

async function runTestsInNode({ integration, filter }) {
	const { run } = await import("./build/testInNode.js")
	console.log("\n--------------- NODE ---------------")
	const result = await run({ integration, filter })
	return resultIsOk(result)
}

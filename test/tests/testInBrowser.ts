import type { RunResult } from "@tutao/otest"

/**
 * runs this test exclusively on browsers (not nodec)
 */
window.browser = (func) => func

/**
 * runs this test exclusively on node (not browsers)
 */
//@ts-ignore
window.node = () => () => {}

globalThis.isBrowser = true

// @ts-ignore
window.tutao = {
	appState: {
		prefixWithoutFile: "./",
	},
}

report("/status", { status: "loaded" })

const searchParams = new URL(location.href).searchParams
const filter = searchParams.get("filter") ?? undefined

try {
	const { run } = await import("./Suite.js")

	report("/status", { status: "imported suite" })

	preTest()
	const result = await run({ filter })
	postTest(result)

	// report results back
	report("/result", result)
} catch (e) {
	report("/status", { status: "error", error: String(e) })
}

function report(path, data) {
	fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })
}

function preTest() {
	document.body.style.fontFamily = "sans-serif"

	const reportElement = document.createElement("p")
	reportElement.id = "report"
	reportElement.style.fontWeight = "bold"
	reportElement.style.fontSize = "30px"
	reportElement.style.margin = "30px 10px"
	reportElement.textContent = `Running tests...`

	document.body.appendChild(reportElement)

	const filterElement = document.createElement("p")
	filterElement.style.fontSize = "18px"
	filterElement.style.margin = "30px 10px"
	filterElement.innerText = filter ? `filter: "${filter}"` : ""

	document.body.appendChild(filterElement)
}

function postTest(result: RunResult) {
	const errCount = result.failingTests.length
	const testPassed = errCount === 0
	const p = document.getElementById("report")!

	p.innerText = testPassed ? "TEST PASSED" : "TEST FAILED (see console)"
	p.style.color = testPassed ? "green" : "red"

	const countersElement = document.createElement("p")
	document.body.appendChild(countersElement)

	const passingElement = document.createElement("span")
	passingElement.style.backgroundColor = "#9FE181BC"
	passingElement.innerText = `passing: ${Number(result.passedTests.length)}`

	const failingElement = document.createElement("span")
	failingElement.style.backgroundColor = "#E19381BC"
	failingElement.innerText = `failing: ${Number(result.failingTests.length)}`

	const skippedElement = document.createElement("span")
	skippedElement.style.backgroundColor = "#E1D381BC"
	skippedElement.innerText = `skipped: ${Number(result.skippedTests.length)}`

	for (const el of [passingElement, failingElement, skippedElement]) {
		countersElement.appendChild(el)
		el.style.margin = "0 10px"
		el.style.padding = "5px"
		el.style.fontWeight = "600"
		el.style.fontSize = "1.3em"
	}
}

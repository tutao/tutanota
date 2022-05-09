export async function runStep(name, cmd) {
	const before = Date.now()
	console.log("Build >", name)
	await cmd()
	console.log("Build >", name, "took", Date.now() - before, "ms")
}
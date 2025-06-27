import fs from "node:fs/promises"
import readline from "node:readline/promises"

const data = JSON.parse(await fs.readFile(process.argv[2], { encoding: "utf8" }))

const rl = readline.createInterface(process.stdin, process.stdout)
const deps = data[undefined]

const reviewedPath = "reviewed.json"
/** @type {Record<string, {who: string, when: string}>} */
let reviewedData = {}
try {
	reviewedData = JSON.parse(await fs.readFile(reviewedPath, { encoding: "utf8" }))
} catch (e) {
	console.log("Could not read reviewed data")
}

let reviewers = await rl.question("who is reviewing: ")

async function markAsReviewed(currentDep) {
	reviewedData[currentDep] = {
		who: reviewers,
		when: new Date().toISOString().slice(0, 10),
	}
	await fs.writeFile(reviewedPath, JSON.stringify(reviewedData, null, 4), { encoding: "utf8" })
}

async function review(currentDep, itsDeps) {
	while (true) {
		console.log(`\nReviewing ${currentDep}`)
		const depsArray = Object.entries(itsDeps)
		for (const [i, [key, value]] of depsArray.entries()) {
			const mark = key.startsWith("node:") || Object.hasOwn(reviewedData, key) ? "✅" : " "
			const stats = calculateStats(key, value)
			console.log(`${i}: ${mark} ${String(stats.reviewed).padStart(4)}/${String(stats.overall).padStart(4)} ${key}`)
		}
		console.log("d: mark as reviewed")
		console.log("x: go up")
		const answer = await rl.question("What to review?: ")
		console.log(`(answered: ${answer})`)
		if (answer === "d") {
			console.log(`Marking ${currentDep} as reviewed`)
			await markAsReviewed(currentDep)
			break
		} else if (answer === "x") {
			break
		}
		const numAnswer = parseInt(answer)
		if (!isNaN(numAnswer) && numAnswer < depsArray.length) {
			const [dep, itsDeps] = depsArray[numAnswer]
			// console.log(`Reviewing: ${dep}`)
			await review(dep, itsDeps)
		}
	}
}

const transitiveDepsCache = new Map()

function transitiveDeps(currentDep, itsDeps) {
	const cached = transitiveDepsCache.get(currentDep)
	if (cached) {
		return cached
	}
	const collectedDeps = Object.entries(itsDeps)
		.map(([dep, depDeps]) => {
			if (typeof depDeps === "string") {
				return []
			}
			return transitiveDeps(dep, depDeps)
		})
		.flat()
	const result = [currentDep, ...collectedDeps]
	transitiveDepsCache.set(currentDep, result)
	return result
}

function calculateStats(currentDep, itsDeps) {
	const collectedTransitiveDeps = transitiveDeps(currentDep, itsDeps)
	const dedupedDeps = new Set(collectedTransitiveDeps)
	let reviewed = 0
	for (const dep of dedupedDeps) {
		if (Object.hasOwn(reviewedData, dep)) {
			reviewed += 1
		}
	}
	return { reviewed, overall: dedupedDeps.size }
}

await review("entry", deps)

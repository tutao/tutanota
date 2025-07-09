// Run the specified node script, intercept its imports and dump then into imports-trace.json.
// run as:
// npm tun trace-imports -- <script path> [script parameters]
// Example: npm run trace-imports -- node_modules/.bin/eslint . --cache --cache-location cache/eslint

import module from "node:module"
import fs from "node:fs"

const fromParentToChild = new Map()

function getOrSet(key) {
	let arr = fromParentToChild.get(key)
	if (arr != null) {
		return arr
	}
	arr = []
	fromParentToChild.set(key, arr)
	return arr
}

export function resolve(specifier, context, nextResolve) {
	const resolved = nextResolve(specifier, context)
	console.log("resolved", specifier, "to", resolved?.url, "from", context.parentURL)
	// fromChildToParent.set(specifier, context.parentURL)
	const children = getOrSet(context.parentURL)
	children.push(resolved.url)
	return resolved
}

export function load(url, context, nextLoad) {
	console.log("loading", url)

	return nextLoad(url, context)
}

module.registerHooks({
	resolve,
	// load
})

function printMap(rootIds, visited = new Set(), indentation = 0) {
	const data = {}
	for (const rootId of rootIds) {
		if (visited.has(rootId)) {
			// console.log(" ".repeat(indentation), "[CYCLE]", rootId)
			if (data[rootId] == null) {
				data[rootId] = `[CYCLE ${rootId}]`
			}
			continue
		}
		visited.add(rootId)
		// console.log(" ".repeat(indentation), "[[[", rootId ?? "[ROOT]")
		const children = fromParentToChild.get(rootId)
		if (rootId && rootId.startsWith("node:")) {
			data[rootId] = "[BUILTIN]"
		} else if (children) {
			const newVisited = new Set(visited)
			newVisited.add(rootId)
			data[rootId] = printMap(children, newVisited, indentation + 1)
			// console.log(" ".repeat(indentation), "]]]`", rootId)
		} else {
			data[rootId] = {}
		}
	}
	return data
}

process.on("beforeExit", async () => {
	const data = printMap([undefined])
	const firstEntry = Object.keys(Object.values(data)[0])[0]
	const nodeModulesIndex = firstEntry.indexOf("node_modules")
	const prefix = firstEntry.slice(0, nodeModulesIndex)
	console.log("common prefix: ", prefix)
	const dataWithStrippedPrefix = mapObjectKeys(data, (value) => {
		if (value.startsWith(prefix)) {
			return value.slice(nodeModulesIndex)
		} else {
			return value
		}
	})
	await fs.promises.writeFile("import-trace.json", JSON.stringify(dataWithStrippedPrefix, null, 4))
	process.exit(0)
})

function mapObjectKeys(object, mapper) {
	return Object.fromEntries(
		Object.entries(object).map(([key, value]) => {
			switch (typeof value) {
				case "string":
					return [mapper(key), value]
				case "object":
					return [mapper(key), mapObjectKeys(value, mapper)]
				default:
					throw new Error("unexpected value")
			}
		}),
	)
}

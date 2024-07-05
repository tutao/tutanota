import fs from "node:fs"

function toDot(modules, output) {
	let buffer = "digraph G {\n"
	buffer += "edge [dir=back]\n"

	for (const m of modules) {
		for (const dep of m.deps) {
			buffer += `"${dep}" -> "${m.id}"\n`
		}
	}
	buffer += "}\n"
	fs.writeFileSync(output, buffer, { encoding: "utf8" })
}

function prune(modules) {
	let avail = modules.filter((m) => m.deps.length == 0)
	if (!avail.length) {
		return
	}

	let id = avail[0].id
	//    console.log("pruning", id);
	let index = modules.indexOf(avail[0])
	modules.splice(index, 1)
	for (const m of modules) {
		m.deps = m.deps.filter((dep) => dep != id)
	}
	prune(modules)
}

function getPrefix(ids) {
	if (ids.length < 2) {
		return ""
	}
	return ids.reduce((prefix, val) => {
		while (val.indexOf(prefix) != 0) {
			prefix = prefix.substring(0, prefix.length - 1)
		}
		return prefix
	})
}

/**
 * Plugin which will generate .dot file with dependency graph
 * @param options {{exclude: string, output: string, prune: boolean, prefix: string}}
 */
export default function plugin(options) {
	let exclude = (str) => options.exclude && str.match(options.exclude)
	let output = options.output
	if (!output) throw new Error("Please specify output file")

	return {
		generateBundle(bundleOptions, bundle, isWrite) {
			let ids = []
			for (const moduleId of this.moduleIds) {
				if (!exclude(moduleId)) {
					ids.push(moduleId)
				}
			}

			let prefix = options.prefix || getPrefix(ids)
			let strip = (str) => (str.startsWith(prefix) ? str.substring(prefix.length) : str)

			let modules = []
			for (const id of ids) {
				let m = {
					id: strip(id),
					deps: this.getModuleInfo(id)
						.importedIds.filter((x) => !exclude(x))
						.concat(this.getModuleInfo(id).dynamicImporters.filter((x) => !exclude(x)))
						.map(strip),
				}
				if (exclude(m.id)) {
					continue
				}
				modules.push(m)
			}
			if (options.prune) {
				prune(modules)
			}
			toDot(modules, output)
		},
	}
}

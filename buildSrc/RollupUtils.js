import path from "node:path"
import fs from "node:fs/promises"

// keeping for admin client for now
export async function writeNollupBundle(generatedBundle, log, dir = "build") {
	await fs.mkdir(dir, { recursive: true })

	return Promise.all(
		generatedBundle.output.map((o) => {
			const filePath = path.join(dir, o.fileName)
			// log("Writing", filePath)
			return fs.writeFile(filePath, o.code || o.source)
		}),
	)
}

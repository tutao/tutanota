import path from "node:path"

const TRANSPILE_IGNORE = new Set<string>([].map((p) => path.normalize(path.resolve(p))))

export class TranspileIgnore {
	public static isIgnored(sourceFilePath: string): boolean {
		return TRANSPILE_IGNORE.has(path.normalize(path.resolve(sourceFilePath)))
	}
}

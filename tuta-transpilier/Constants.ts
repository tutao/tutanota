import path from "node:path"

// @ts-ignore
const dirname: string = import.meta.dirname
export const TUTANOTA_ROOT: string = path.normalize(path.join(dirname, ".."))
console.log(">>>>>> root: " + TUTANOTA_ROOT)

export function joinPaths(...paths: string[]) {
	return path.join(...paths)
}

export function getRelativePath(from: string, to: string): string {
	return path.relative(from, to)
}

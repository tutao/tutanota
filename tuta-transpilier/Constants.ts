import path from "node:path"

// @ts-ignore
const dirname: string = import.meta.dirname
export const TUTANOTA_ROOT: string = path.normalize(path.join(dirname, ".."))

export class Assert {
	static isTrue(condition: boolean, msg) {
		if (condition) {
			return
		}
		throw new Error("Unsatisfied Condition: " + msg)
	}
}

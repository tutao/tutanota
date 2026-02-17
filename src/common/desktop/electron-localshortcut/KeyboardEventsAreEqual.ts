import { isAsciiChar } from "@tutao/tutanota-utils"

function _lower(key: any) {
	if (typeof key !== "string") {
		return key
	}

	return key.toLowerCase()
}

export default function areEqual(ev1: any, ev2: any): boolean {
	if (ev1 === ev2) {
		// Same object
		// console.log(`Events are same.`)
		return true
	}

	const keyIsAsciiChar = String(ev2.key).length === 1 && isAsciiChar(ev2.key)

	for (const prop of ["altKey", "ctrlKey", "shiftKey", "metaKey"]) {
		const [value1, value2] = [ev1[prop], ev2[prop]]

		if (Boolean(value1) !== Boolean(value2)) {
			// One of the prop is different
			// console.log(`Comparing prop ${prop}: ${value1} ${value2}`);
			return false
		}
	}

	if (keyIsAsciiChar) {
		return _lower(ev1.key) === _lower(ev2.key) && ev1.key !== undefined
	} else {
		return ev1.code === ev2.code && ev1.code !== undefined
	}
}

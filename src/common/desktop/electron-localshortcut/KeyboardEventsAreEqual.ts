import { isLatinChar } from "@tutao/tutanota-utils"

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

	const keyIsLatin = isLatinChar(ev2.key)

	for (const prop of ["altKey", "ctrlKey", "shiftKey", "metaKey"]) {
		const [value1, value2] = [ev1[prop], ev2[prop]]

		if (Boolean(value1) !== Boolean(value2)) {
			// One of the prop is different
			// console.log(`Comparing prop ${prop}: ${value1} ${value2}`);
			return false
		}
	}

	if (keyIsLatin && _lower(ev1.key) === _lower(ev2.key) && ev1.key !== undefined) {
		// Events are equals
		return true
	} else if (!keyIsLatin && _lower(ev1.code) === _lower(ev2.code) && ev1.code !== undefined) {
		return true
	}

	// Key or code are differents
	// console.log(`key or code are differents. ${ev1.key} !== ${ev2.key} ${ev1.code} !== ${ev2.code}`);
	return false
}

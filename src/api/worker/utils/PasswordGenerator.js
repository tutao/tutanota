// @flow

import {Randomizer} from "../crypto/Randomizer"

const MIN_VALUE = 32
const MAX_VALUE = 126 - MIN_VALUE
const LENGTH = 13

/**
 * Makes a random password out of printable ASCII symbols.
 */
export function generatePassword(random: Randomizer): string {
	const bytes = random.generateRandomData(LENGTH)

	// TODO: filter out some of the hard-to-read characters like `,',',"
	return Array.from(bytes).map(b => String.fromCharCode((b % MAX_VALUE) + MIN_VALUE)).join("")
}

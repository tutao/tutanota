//@flow

import {assertMainOrNodeBoot} from "../../api/common/Env"
import {assert} from "../../api/common/utils/Utils"

assertMainOrNodeBoot()

// 3 or 6 digit hex color codes
export const VALID_HEX_CODE_FORMAT: RegExp = new RegExp("^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$")

export function isColorLight(c: string): boolean {

	const {r, g, b} = hexToRgb(c)

	// Counting the perceptive luminance
	// human eye favors green color...
	const a = 1 - (0.299 * r + 0.587 * g + 0.114 * b) / 255
	return a < 0.5
}

export function hexToRgb(colorCode: string): {r: number, g: number, b: number} {

	assert(VALID_HEX_CODE_FORMAT.test(colorCode), "Invalid color code: " + colorCode)

	let hexWithoutHash = colorCode.slice(1)
	if (hexWithoutHash.length === 3) {
		hexWithoutHash = expandHexTriplet(hexWithoutHash)   // convert from 3 to 6 digits by duplicating each digit
	}

	const rgb = parseInt(hexWithoutHash, 16);   // convert rrggbb to decimal

	const r = (rgb >> 16) & 0xff  // extract red
	const g = (rgb >> 8) & 0xff   // extract green
	const b = (rgb >> 0) & 0xff   // extract blue


	return {r, g, b}
}

export function rgbToHex(color: {r: number, g: number, b: number}): string {
	return "#" + ((1 << 24) + (color.r << 16) + (color.g << 8) + color.b).toString(16).slice(1);
}

/**
 * Convert RGB to RRGGBB
 */
export function expandHexTriplet(triplet: string): string {
	assert(triplet.length === 3, "Provided invalid value for triplet: " + triplet)
	return Array.from(triplet).reduce((acc, cur) => `${acc}${cur}${cur}`, "")
}
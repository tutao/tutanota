import { assert } from "@tutao/tutanota-utils"
import { assertMainOrNodeBoot } from "../../api/common/Env"

assertMainOrNodeBoot()
// 3 or 6 digit hex color codes
export const VALID_HEX_CODE_FORMAT: RegExp = new RegExp("^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$")

/**
 * Returns true if the color code is a valid hex color code.
 *
 * The format can be #RGB or #RRGGBB, and it is not case-sensitive, but the digits must be hexadecimal,
 * with 1 or 2 digits per color channel, and the code must be prefixed with an octothorpe character (`#`).
 */
export function isValidColorCode(colorCode: string): boolean {
	return VALID_HEX_CODE_FORMAT.test(colorCode)
}

export function isColorLight(c: string): boolean {
	const { r, g, b } = hexToRgb(c)
	// Counting the perceptive luminance
	// human eye favors green color...
	const a = 1 - (0.299 * r + 0.587 * g + 0.114 * b) / 255
	return a < 0.5
}

export function hexToRgb(colorCode: string): {
	r: number
	g: number
	b: number
} {
	assert(isValidColorCode(colorCode), "Invalid color code: " + colorCode)
	let hexWithoutHash = colorCode.slice(1)

	if (hexWithoutHash.length === 3) {
		hexWithoutHash = expandHexTriplet(hexWithoutHash) // convert from 3 to 6 digits by duplicating each digit
	}

	const rgb = parseInt(hexWithoutHash, 16) // convert rrggbb to decimal

	const r = (rgb >> 16) & 0xff // extract red

	const g = (rgb >> 8) & 0xff // extract green

	const b = (rgb >> 0) & 0xff // extract blue

	return {
		r,
		g,
		b,
	}
}

export function rgbToHex(color: { r: number; g: number; b: number }): string {
	return "#" + ((1 << 24) + (color.r << 16) + (color.g << 8) + color.b).toString(16).slice(1)
}

export function hexToRGBAString(color: string, alpha: number) {
	const { r, g, b } = hexToRgb(color)
	return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/**
 * Convert RGB to RRGGBB
 */
export function expandHexTriplet(triplet: string): string {
	assert(triplet.length === 3, "Provided invalid value for triplet: " + triplet)
	return Array.from(triplet).reduce((acc, cur) => `${acc}${cur}${cur}`, "")
}

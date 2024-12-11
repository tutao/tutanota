import { assert } from "@tutao/tutanota-utils"
import { assertMainOrNodeBoot } from "../../api/common/Env"

assertMainOrNodeBoot()
// 3 or 6 digit hex color codes
export const VALID_HEX_CODE_FORMAT: RegExp = new RegExp("^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$")

export const MAX_HUE_ANGLE = 360

/**
 * Returns true if the color code is a valid hex color code.
 *
 * The format can be #RGB or #RRGGBB, and it is not case-sensitive, but the digits must be hexadecimal,
 * with 1 or 2 digits per color channel, and the code must be prefixed with an octothorpe character (`#`).
 */
export function isValidColorCode(colorCode: string): boolean {
	return VALID_HEX_CODE_FORMAT.test(colorCode)
}

export function isValidCSSHexColor(colorCode: string): boolean {
	return isValidColorCode(colorCode) && CSS.supports("color", colorCode)
}

export function getColorLuminance(c: string): number {
	const { r, g, b } = hexToRgb(c)
	// Counting the perceptive luminance
	// human eye favors green color...
	return (0.299 * r + 0.587 * g + 0.114 * b) / 255
}

export function isMonochrome(c: string): boolean {
	const { r, g, b } = hexToRgb(c)
	return r == g && g == b
}

export function isColorLight(c: string): boolean {
	return getColorLuminance(c) > 0.5
}

export function normalizeHueAngle(hue: number): number {
	return ((hue % MAX_HUE_ANGLE) + MAX_HUE_ANGLE) % MAX_HUE_ANGLE
}

export function hexToHSL(hex: string): { h: number; s: number; l: number } {
	return rgbToHSL(hexToRgb(hex))
}

export function hslToHex(color: { h: number; s: number; l: number }): string {
	return rgbToHex(hslToRGB(color))
}

/*
 * Source: https://www.w3.org/TR/2011/REC-css3-color-20110607/#hsl-color
 */
export function hslToRGB(color: { h: number; s: number; l: number }): { r: number; g: number; b: number } {
	let { h, s, l } = color

	h = h % MAX_HUE_ANGLE

	if (h < 0) {
		h += MAX_HUE_ANGLE
	}

	s /= 100
	l /= 100

	function f(n: number) {
		let k = (n + h / 30) % 12
		let a = s * Math.min(l, 1 - l)
		return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))
	}

	return {
		r: Math.round(f(0) * 255),
		g: Math.round(f(8) * 255),
		b: Math.round(f(4) * 255),
	}
}

/*
 * CC0-1.0 license from MDN
 * Source: https://github.com/mdn/css-examples/blob/main/modules/colors.html
 */
export function rgbToHSL(color: { r: number; g: number; b: number }): { h: number; s: number; l: number } {
	let { r, g, b } = color

	// Let's have r, g, b in the range [0, 1]
	r = r / 255
	g = g / 255
	b = b / 255
	const cmin = Math.min(r, g, b)
	const cmax = Math.max(r, g, b)
	const delta = cmax - cmin
	let h = 0,
		s = 0,
		l = 0

	if (delta === 0) {
		h = 0
	} else if (cmax === r) {
		h = ((g - b) / delta) % 6
	} else if (cmax === g) {
		h = (b - r) / delta + 2
	} else h = (r - g) / delta + 4

	h = Math.round(h * 60)

	// We want an angle between 0 and MAX_HUE_ANGLE (360°)
	if (h < 0) {
		h += MAX_HUE_ANGLE
	}

	l = (cmax + cmin) / 2
	s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1))
	s = Number((s * 100).toFixed(1))
	l = Number((l * 100).toFixed(1))

	return { h: Math.round(h), s: Math.round(s), l: Math.round(l) }
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

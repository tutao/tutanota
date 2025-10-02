import { assert } from "@tutao/tutanota-utils"
import { assertMainOrNodeBoot } from "../../api/common/Env"

assertMainOrNodeBoot()

/**
 * Red-Green-Blue color representation with each channel in the
 * range of 0 to 255
 */
export interface RGB {
	r: number
	g: number
	b: number
}

/**
 * RGB but with Alpha channel.
 */
export interface RGBA extends RGB {
	/** the alpha is a number in 0-1 range */
	a: number
}

/**
 * Hue-Saturation-Lightness color representation.
 */
export interface HSL {
	/** hue angle between 0 and 360 */
	h: number
	/** saturation percentage between 0 and 100 */
	s: number
	/** lightness percentage between 0 and 100 */
	l: number
}

// 3 or 6 digit hex color codes
export const VALID_SOLID_HEX_CODE_FORMAT: RegExp = new RegExp("^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$")

export const MAX_HUE_ANGLE = 360

/**
 * Returns true if the color code is a valid solid color hex code.
 *
 * The format can be #RGB or #RRGGBB, and it is not case-sensitive, but the digits must be hexadecimal,
 * with 1 or 2 digits per color channel, and the code must be prefixed with an octothorpe character (`#`).
 */
export function isValidSolidColorCode(colorCode: string): boolean {
	return VALID_SOLID_HEX_CODE_FORMAT.test(colorCode)
}

export function isValidCSSHexColor(colorCode: string): boolean {
	return isValidSolidColorCode(colorCode) && CSS.supports("color", colorCode)
}

export function getColorLuminance(c: string): number {
	const { r, g, b } = hexToRGBA(c)
	// Counting the perceptive luminance
	// human eye favors green color...
	return (0.299 * r + 0.587 * g + 0.114 * b) / 255
}

export function isColorLight(c: string): boolean {
	return getColorLuminance(c) > 0.5
}

export function normalizeHueAngle(hue: number): number {
	return ((hue % MAX_HUE_ANGLE) + MAX_HUE_ANGLE) % MAX_HUE_ANGLE
}

export function hexToHSL(hex: string): HSL {
	return rgbToHSL(hexToRgb(hex))
}

export function hslToHex(color: HSL): string {
	return rgbToHex(hslToRGB(color))
}

/*
 * Source: https://www.w3.org/TR/2011/REC-css3-color-20110607/#hsl-color
 */
export function hslToRGB(color: HSL): RGB {
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
export function rgbToHSL(color: RGB): HSL {
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

/**
 * Convert {@param colorCode} in hex (including mandatory leading #)
 * into RGBA. Defaults alpha to 255 if the input is #RRGGBB or #RGB.
 */
export function hexToRgba(colorCode: string): RGBA {
	const longMatch = colorCode.match(/^#([\da-fA-F]{2})([\da-fA-F]{2})([\da-fA-F]{2})([\da-fA-F]{2})?$/)

	if (longMatch != null) {
		const [, r, g, b, a] = longMatch

		return {
			r: parseInt(r, 16),
			g: parseInt(g, 16),
			b: parseInt(b, 16),
			a: a == null ? 0xff : parseInt(a, 16),
		}
	}

	const shortMatch = colorCode.match(/^#([\da-fA-F])([\da-fA-F])([\da-fA-F])([\da-fA-F])?$/)
	if (shortMatch != null) {
		const [, rs, gs, bs, as] = shortMatch
		const r = parseInt(rs, 16)
		const g = parseInt(gs, 16)
		const b = parseInt(bs, 16)
		const a = as == null ? 0xf : parseInt(as, 16)

		// if there's only one digit per channel provided e.g. "a" we
		// want to convert it to "aa". "a" would look like
		// 0 0 0 0 1 0 1 0
		// and we want the result to look like
		// 1 0 1 0 1 0 1 0
		// so we do the shift which make it
		// 1 0 1 0 0 0 0 0
		// and then we OR it with itself (which only has the lowest
		// bits) which brings it to
		// 1 0 1 0 1 0 1 0
		return {
			r: (r << 4) | r,
			g: (g << 4) | g,
			b: (b << 4) | b,
			a: (a << 4) | a,
		}
	}
	throw new Error("Invalid hex color: " + colorCode)
}

/**
 * Convert {@param colorCode} in hex (including mandatory leading #)
 * into RGB.
 */
export function hexToRgb(colorCode: string): RGB {
	assert(isValidSolidColorCode(colorCode), "Invalid color code: " + colorCode)
	let hexWithoutHash = colorCode.slice(1)

	if (hexWithoutHash.length === 3) {
		hexWithoutHash = expandHexTriplet(hexWithoutHash) // convert from 3 to 6 digits by duplicating each digit
	}

	const rgb = parseInt(hexWithoutHash, 16) // convert rrggbb to decimal

	// each channel is one byte with red being in the most significant
	// bytes and blue in the least significant.
	// we shift each part to the least significant byte and then
	// mask it in a way that only the lowest significant byte is present
	// (0xff is a shorthand for 0x0000ff)
	const r = (rgb >> 16) & 0xff // extract red

	const g = (rgb >> 8) & 0xff // extract green

	const b = (rgb >> 0) & 0xff // extract blue

	return {
		r,
		g,
		b,
	}
}

/**
 * Convert {@param color} in RGB into 6-letter hex with leading "#", not
 * including the alpha.
 */
export function rgbToHex(color: RGB): string {
	return "#" + ((color.r << 16) | (color.g << 8) | color.b).toString(16).padStart(6, "0")
}

/**
 * Convert {@param color} in RGBA into 8-letter hex with leading "#",
 * including the alpha.
 */
export function rgbaToHex(color: RGBA): string {
	return rgbToHex(color) + color.a.toString(16).padStart(2, "0")
}

export function hexToRGBA(color: string) {
	let hexWithoutHash = color.slice(1)
	if (hexWithoutHash.length !== 3 && hexWithoutHash.length !== 6 && hexWithoutHash.length !== 8) {
		throw Error("Invalid HEX-ALPHA color code: " + color)
	}

	if (hexWithoutHash.length === 3) {
		hexWithoutHash = `${expandHexTriplet(hexWithoutHash)}FF`
	} else if (hexWithoutHash.length === 6) {
		hexWithoutHash = `${hexWithoutHash}FF`
	}

	const { r, g, b } = hexToRgb(`#${hexWithoutHash.substring(0, 6)}`)
	const alpha = Number.parseInt(hexWithoutHash.substring(6), 16)
	return { r, g, b, a: alpha / 255 }
}

export function hexToRGBAString(color: string, alpha: number) {
	const { r, g, b } = hexToRgb(color)
	return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/**
 * Compute the given color string as ARGB using the document in the current window.
 *
 * The color string can be a hex string, a color name, argb()/rgb() syntax, or anything else recognizable by the web
 * view's CSS engine.
 *
 * @param color color string to compute, or null if it failed (e.g. invalid format)
 */
export function computeColor(color: string): RGBA | null {
	// We have to create an element in the DOM because colors of elements not in the DOM can't be computed, including
	// DocumentFragment. Shouldn't affect anything if it's just an empty span element.
	//
	// We can then just use getComputedStyle to quickly see what was computed.
	const element = document.createElement("span")

	// Use color() to transmute the color into srgb (with optional alpha) in case the color is in a different color
	// space (e.g. oklab), since getComputedStyle passes through the color space
	element.style.color = `color(from ${color} srgb r g b / alpha)`
	document.body.appendChild(element)
	const computed = getComputedStyle(element).color
	document.body.removeChild(element)

	// Extract the color components
	const matched = computed.match(/^color\(srgb ([0-9]+(\.[0-9]+)?) ([0-9]+(\.[0-9]+)?) ([0-9]+(\.[0-9]+)?)( \/ ([0-9]+(\.[0-9]+)?))?\)$/)
	if (matched == null) {
		return null
	}

	const red = matched[1]
	const green = matched[3]
	const blue = matched[5]
	const alpha = matched[8] ?? "1.0"

	return {
		r: Number(red) * 255,
		g: Number(green) * 255,
		b: Number(blue) * 255,
		a: Number(alpha),
	}
}

/**
 * Convert RGB to RRGGBB
 */
export function expandHexTriplet(triplet: string): string {
	assert(triplet.length === 3, "Provided invalid value for triplet: " + triplet)
	return Array.from(triplet).reduce((acc, cur) => `${acc}${cur}${cur}`, "")
}

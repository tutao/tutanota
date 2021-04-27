//@flow

import {assertMainOrNodeBoot} from "../../api/common/Env"
import {ProgrammingError} from "../../api/common/error/ProgrammingError"

assertMainOrNodeBoot()

export function isColorLight(c: string): boolean {
	if (c[0] !== "#" || c.length !== 7) {
		throw new ProgrammingError("Invalid color format: " + c)
	}
	const rgb = parseInt(c.slice(1), 16);   // convert rrggbb to decimal
	const r = (rgb >> 16) & 0xff  // extract red
	const g = (rgb >> 8) & 0xff   // extract green
	const b = (rgb >> 0) & 0xff   // extract blue

	// Counting the perceptive luminance
	// human eye favors green color...
	const a = 1 - (0.299 * r + 0.587 * g + 0.114 * b) / 255
	return a < 0.5
}

/**
 * We use the alpha channel instead of using opacity for fading colors. Opacity changes are slow on mobile devices as they
 * effect the whole tree of the dom element with changing opacity.
 *
 * See http://stackoverflow.com/a/14677373 for a more detailed explanation.
 */
export function hexToRgb(hexColor: string): {r: number, g: number, b: number} {
	if (!hexColor.startsWith("#")) {
		throw new Error("Illegal color definition: " + hexColor)
	}
	const withoutHash = hexColor.substring(1)
	let components
	if (withoutHash.length === 6) {
		components = {
			r: withoutHash.slice(0, 2),
			g: withoutHash.slice(2, 4),
			b: withoutHash.slice(4, 6),
		}
	} else if (withoutHash.length === 3) {
		components = {
			r: withoutHash[0] + withoutHash[0],
			g: withoutHash[1] + withoutHash[1],
			b: withoutHash[2] + withoutHash[2],
		}
	} else {
		throw new Error("Illegal color definition: " + hexColor)
	}
	const rgb = {
		r: parseInt(components.r, 16),
		g: parseInt(components.g, 16),
		b: parseInt(components.b, 16),
	}
	if (isNaN(rgb.r) || isNaN(rgb.g) || isNaN(rgb.b)) {
		throw new Error("Illegal color definition: " + hexColor)
	}
	return rgb
}

export function rgbToHex(color: {r: number, g: number, b: number}): string {
	return "#" + ((1 << 24) + (color.r << 16) + (color.g << 8) + color.b).toString(16).slice(1);
}
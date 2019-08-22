//@flow

export function isColorLight(c: string): boolean {
	const rgb = parseInt(c, 16);   // convert rrggbb to decimal
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
	hexColor = hexColor.substring(1)
	let split = hexColor.match(/.{1,2}/g)
	if (split && split.length === 3) {
		return {
			r: parseInt(split[0], 16),
			g: parseInt(split[1], 16),
			b: parseInt(split[2], 16)
		}
	}
	throw new Error("illegal color definition")
}

export function rgbToHex(color: {r: number, g: number, b: number}): string {
	return "#" + ((1 << 24) + (color.r << 16) + (color.g << 8) + color.b).toString(16).slice(1);
}
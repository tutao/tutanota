import { pureComponent } from "./PureComponent.js"
import m from "mithril"
import { colorForBg } from "./GuiUtils.js"
import { size } from "../size.js"
import { theme } from "../theme.js"
import { isColorLight } from "./Color.js"

const supportsRelativeHslColors = typeof CSS !== "undefined" ? CSS.supports("color", `hsl(from #ccc h calc(min(50, s)) l)`) : false

export function getLabelColor(backgroundColor: string | null): string {
	const labelColor = backgroundColor ?? theme.content_accent
	const isDarkTheme = !isColorLight(theme.content_bg)
	// make a color have the same hue and lightness with saturation capped to 50
	return isDarkTheme ? limitedSaturationColor(labelColor) : labelColor
}

function limitedSaturationColor(color: string): string {
	// iOS only implements relative HSL colors from 16.4 on and only the legacy syntax (with percents) while FF does not
	// recognize the legacy syntax anymore.
	return supportsRelativeHslColors ? `hsl(from ${color} h calc(min(50, s)) l)` : `hsl(from ${color} h calc(min(50%, s)) l)`
}

/**
 * Displays a mail label with color and name.
 */
export const Label = pureComponent(function Label({ text, color }: { text: string; color: string | null }) {
	const labelColor = getLabelColor(color)
	return m(
		"span.small.text-center.text-ellipsis.border-radius-m",
		{
			style: {
				// in dark theme override saturation to aid readability. This is not relative but absolute saturation. We preserve the hue.
				backgroundColor: labelColor,
				color: colorForBg(color ?? theme.content_accent),
				padding: `1px ${size.vpad_xsm}px`,
			},
		},
		text,
	)
})

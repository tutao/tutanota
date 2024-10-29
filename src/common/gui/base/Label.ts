import { pureComponent } from "./PureComponent.js"
import m from "mithril"
import { colorForBg } from "./GuiUtils.js"
import { size } from "../size.js"
import { theme } from "../theme.js"
import { isColorLight } from "./Color.js"

export function getLabelColor(backgroundColor: string | null): string {
	const labelColor = backgroundColor ?? theme.content_accent
	const isDarkTheme = !isColorLight(theme.content_bg)
	return isDarkTheme ? `hsl(from ${labelColor} h 50 l)` : labelColor
}

/**
 * Displays a mail label with color and name.
 */
export const Label = pureComponent(function Label({ text, color }: { text: string; color: string | null }) {
	const labelColor = getLabelColor(color)
	return m(
		"span.small.text-ellipsis",
		{
			style: {
				// in dark theme override saturation to aid readability. This is not relative but absolute saturation. We preserve the hue.
				backgroundColor: labelColor,
				color: colorForBg(color ?? theme.content_accent),
				padding: `1px ${size.vpad_xsm}px`,
				borderRadius: "8px",
			},
		},
		text,
	)
})

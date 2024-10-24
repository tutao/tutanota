import { pureComponent } from "./PureComponent.js"
import m from "mithril"
import { colorForBg } from "./GuiUtils.js"
import { size } from "../size.js"
import { theme } from "../theme.js"
import { isColorLight } from "./Color.js"

/**
 * Displays a mail label with color and name.
 */
export const Label = pureComponent(function Label({ text, color }: { text: string; color: string }) {
	const backgroundColor = "#" + color
	const isDarkTheme = !isColorLight(theme.content_bg)
	return m(
		"span.small.text-ellipsis",
		{
			style: {
				// in dark theme override saturation to aid readability. This is not relative but absolute saturation. We preserve the hue.
				backgroundColor: isDarkTheme ? `hsl(from ${backgroundColor} h 50 l)` : backgroundColor,
				color: colorForBg(backgroundColor),
				padding: `1px ${size.vpad_xsm}px`,
				borderRadius: "8px",
			},
		},
		text,
	)
})

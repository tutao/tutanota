import { pureComponent } from "./PureComponent.js"
import m from "mithril"
import { ClickHandler, colorForBg } from "./GuiUtils.js"
import { size } from "../size.js"
import { isDarkTheme, theme } from "../theme.js"
import { Icons } from "./icons/Icons"
import { IconButton } from "./IconButton"
import { ButtonSize } from "./ButtonSize"
import { noOp } from "@tutao/utils"
import { isColorLight } from "./Color"

const supportsRelativeHslColors = typeof CSS !== "undefined" ? CSS.supports("color", `hsl(from #ccc h calc(min(50, s)) l)`) : false

export function getLabelColor(backgroundColor: string | null): string {
	const labelColor = backgroundColor ?? theme.primary
	// make a color have the same hue and lightness with saturation capped to 50
	return isDarkTheme() ? limitedSaturationColor(labelColor) : labelColor
}

function limitedSaturationColor(color: string): string {
	// iOS only implements relative HSL colors from 16.4 on and only the legacy syntax (with percents) while FF does not
	// recognize the legacy syntax anymore.
	return supportsRelativeHslColors ? `hsl(from ${color} h calc(min(50, s)) l)` : `hsl(from ${color} h calc(min(50%, s)) l)`
}

/**
 * Displays a mail label with color and name.
 */
export const Label = pureComponent(function Label({
	text,
	color,
	cancelable,
	cancelAction,
}: {
	text: string
	color: string | null
	cancelable: boolean | null
	cancelAction?: ClickHandler | null
}) {
	const labelColor = getLabelColor(color)
	const cancelButtonColor = isColorLight(color ?? theme.primary) ? ".icon-button-wrapper-black-icon" : ".icon-button-wrapper-white-icon"
	return m(
		"span.text-center.text-ellipsis" +
			(cancelable ? `.normal-font-size.border-radius-16.min-width-fit.flex.center-vertically${cancelButtonColor}` : ".small.border-radius-8"),
		{
			"data-testid": "label",
			style: {
				// in dark theme override saturation to aid readability. This is not relative but absolute saturation. We preserve the hue.
				backgroundColor: labelColor,
				color: colorForBg(color ?? theme.primary),
				padding: cancelable ? `${size.spacing_4}px` : `1px ${size.spacing_4}px`,
				paddingLeft: cancelable ? `${size.spacing_8}px` : undefined,
			},
		},
		text,
		cancelable
			? m(IconButton, {
					icon: Icons.X,
					label: "delete_action",
					click: cancelAction ?? noOp,
					size: ButtonSize.ExtraSmall,
					style: {
						marginLeft: "4px",
						marginRight: "4px",
					},
				})
			: "",
	)
})

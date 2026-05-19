// If icon is passed in, it will be displayed instead of percentage number
import { Icons } from "./base/icons/Icons"
import m, { Children, Component, Vnode } from "mithril"
import { theme } from "./theme"
import { component_size, px } from "./size"
import { Icon, IconSize } from "./base/Icon"

export interface CircleLoadingBarAttrs {
	backgroundColor: string
	percentage?: number
	color?: string
	icon?: Icons
}

export class CircleLoadingBar implements Component<CircleLoadingBarAttrs> {
	view({ attrs }: Vnode<CircleLoadingBarAttrs>): Children {
		// if no percentage is given, 100 is used to get a full circle
		const percentage = attrs.percentage ?? 100
		const progressCircleColor = attrs.color ?? theme.on_surface

		return m(
			".flex.justify-center.items-center.no-shrink",
			{
				role: "progressbar",
				"aria-valuemin": 0,
				"aria-valuemax": 100,
				"aria-valuenow": percentage,
				style: {
					"--progress-value": percentage,
					width: px(component_size.button_height),
					height: px(component_size.button_height),
					borderRadius: "50%",
					// drawing a circle on the inside and a colored circle on the outside (with the rest filled with transparent)
					background: `radial-gradient(closest-side, ${attrs.backgroundColor} 79%, transparent 80% 100%), conic-gradient(${progressCircleColor} calc(var(--progress-value) * 1%), transparent 0)`,
					transition: "--progress-value 200ms",
				},
			},
			attrs.icon
				? m(Icon, {
						icon: attrs.icon,
						size: IconSize.PX32,
						style: {
							fill: attrs.color,
						},
					})
				: m(".small.font-weight-500", `${percentage}%`),
		)
	}
}

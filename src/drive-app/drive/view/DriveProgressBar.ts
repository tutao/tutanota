import m, { Children, Component, Vnode } from "mithril"
import { theme } from "../../../common/gui/theme"
import { px, size } from "../../../common/gui/size"

interface DriveProgressBarAttrs {
	percentage: number
}

export class DriveProgressBar implements Component<DriveProgressBarAttrs> {
	view({ attrs: { percentage } }: Vnode<DriveProgressBarAttrs>): Children {
		return m(
			"",
			{
				style: { background: theme.state_bg_hover, "border-radius": px(size.radius_4) },
			},
			m("", {
				style: {
					transformOrigin: "left",
					transform: `scaleX(${percentage / 100})`,
					transition: "transform 100ms",
					height: `${size.core_16}px`,
					backgroundColor: theme.primary_container,
					"border-radius": px(size.radius_4),
				},
			}),
		)
	}
}

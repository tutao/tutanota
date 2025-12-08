import m, { Children, Component, Vnode } from "mithril"
import { theme } from "../../gui/theme"
import { px } from "../../gui/size"

export interface PasswordStrengthIndicatorAttrs {
	percentageCompleted: number
	width?: string
	class?: string
}

export class PasswordStrengthIndicator implements Component<PasswordStrengthIndicatorAttrs> {
	view({ attrs }: Vnode<PasswordStrengthIndicatorAttrs>): Children {
		const clamped = Math.max(0, Math.min(attrs.percentageCompleted, 100))

		// Map percentage → number of filled segments (0–3)
		const segmentsFilled = clamped === 0 ? 0 : Math.ceil((clamped / 100) * 3)

		// Base (empty) color: light / neutral
		const emptyColor = theme.surface_container_highest

		// Filled color depending on how many segments are filled
		let filledColor = emptyColor
		if (segmentsFilled === 1) {
			filledColor = theme.error
		} else if (segmentsFilled === 2) {
			filledColor = theme.warning
		} else if (segmentsFilled === 3) {
			filledColor = theme.success
		}

		return m(
			"",
			{
				class: attrs.class,
				style: {
					width: attrs.width ?? "100%",
					height: px(4),
					display: "flex",
					"align-items": "stretch",
				},
			},
			[0, 1, 2].map((i) =>
				m("", {
					style: {
						flex: "1 1 0",
						"background-color": i < segmentsFilled ? filledColor : emptyColor,
						// separate segments
						"margin-right": i < 2 ? px(4) : 0,
						"border-radius": px(2),
					},
				}),
			),
		)
	}
}

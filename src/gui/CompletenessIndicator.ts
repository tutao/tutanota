import m, { Children, Component, Vnode } from "mithril"
import { theme } from "./theme.js"
import { DefaultAnimationTime } from "./animation/Animations.js"

export interface CompletenessIndicatorAttrs {
	percentageCompleted: number
	width?: string
	passwordColorScale?: boolean
}

export class CompletenessIndicator implements Component<CompletenessIndicatorAttrs> {
	view({ attrs }: Vnode<CompletenessIndicatorAttrs>): Children {
		const mediumStrengthPercentage: number = 30
		const goodStrengthPercentage: number = 75
		return m(
			"",
			{
				style: {
					border: attrs.passwordColorScale ? "" : `1px solid ${theme.content_button}`,
					width: attrs.width ?? "100px",
					height: "8px",
				},
			},
			m("", {
				style: attrs.passwordColorScale
					? {
							"background-color":
								attrs.percentageCompleted < mediumStrengthPercentage
									? "hsl(0deg 50% 50%)"
									: attrs.percentageCompleted < goodStrengthPercentage
									? "hsl(60deg 50% 50%)"
									: "hsl(120deg 50% 50%)",
							"background-image":
								attrs.percentageCompleted < mediumStrengthPercentage
									? "linear-gradient(90deg, hsl(0deg 50% 50%) 0%, hsl(0deg 50% 50%) 100%)"
									: attrs.percentageCompleted < goodStrengthPercentage
									? "linear-gradient(90deg, hsl(0deg 50% 50%) 0%, hsl(60deg 50% 50%) 100%)"
									: "linear-gradient(90deg, hsl(0deg 50% 50%) 0%, hsl(60deg 50% 50%) 75%, hsl(120deg 50% 50%) 100%)",
							transition: `width ${DefaultAnimationTime * 3}ms ease 0s`,
							width: attrs.percentageCompleted + "%",
							height: "100%",
							"border-radius": "8px",
					  }
					: {
							"background-color": theme.content_button,
							width: attrs.percentageCompleted + "%",
							height: "100%",
					  },
			}),
		)
	}
}

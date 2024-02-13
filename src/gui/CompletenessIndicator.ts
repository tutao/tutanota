import m, { Children, Component, Vnode } from "mithril"
import { theme } from "./theme.js"
import { DefaultAnimationTime } from "./animation/Animations.js"

export interface CompletenessIndicatorAttrs {
	percentageCompleted: number
	width?: string
}

export class CompletenessIndicator implements Component<CompletenessIndicatorAttrs> {
	view({ attrs }: Vnode<CompletenessIndicatorAttrs>): Children {
		const mediumStrengthPercentage: number = 30
		const goodStrengthPercentage: number = 75
		return m(
			"",
			{
				style: {
					border: `1px solid ${theme.content_button}`,
					width: attrs.width ?? "100px",
					height: "8px",
				},
			},
			m("", {
				style: {
					"background-color":
						attrs.percentageCompleted < mediumStrengthPercentage ? "red" : attrs.percentageCompleted < goodStrengthPercentage ? "yellow" : "green",
					"background-image":
						attrs.percentageCompleted < mediumStrengthPercentage
							? "linear-gradient(90deg, rgba(255,0,0,1) 0%, rgba(255,0,0,1) 100%)"
							: attrs.percentageCompleted < goodStrengthPercentage
							? "linear-gradient(90deg, rgba(255,0,0,1) 0%, rgba(255,255,0,1) 100%)"
							: "linear-gradient(90deg, rgba(255,0,0,1) 0%, rgba(255,245,0,1) 75%, rgba(0,255,0,1) 100%)",
					transition: `width ${DefaultAnimationTime * 3}ms ease 0s`,
					width: attrs.percentageCompleted + "%",
					height: "100%",
				},
			}),
		)
	}
}

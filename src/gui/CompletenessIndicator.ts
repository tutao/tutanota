import m, { Children, Component, Vnode } from "mithril"
import { theme } from "./theme.js"

export interface CompletenessIndicatorAttrs {
	percentageCompleted: number
	width?: string
}

export class CompletenessIndicator implements Component<CompletenessIndicatorAttrs> {
	view({ attrs }: Vnode<CompletenessIndicatorAttrs>): Children {
		return m(
			"",
			{
				style: {
					border: `1px solid ${theme.content_button}`,
					width: attrs.width ?? "100px",
					height: "10px",
				},
			},
			m("", {
				style: {
					"background-color": attrs.percentageCompleted < 50 ? "red" : attrs.percentageCompleted < 75 ? "yellow" : "green",
					// red to yellow to green
					"background-image":
						attrs.percentageCompleted < 50
							? "linear-gradient(90deg, rgba(150,50,50,1) 0%, rgba(255,0,0,1) 100%)" // black to red
							: attrs.percentageCompleted < 75
							? "linear-gradient(90deg, rgba(255,0,0,1) 0%, rgba(255,255,0,1) 100%)" // red to yellow
							: "linear-gradient(90deg, rgba(255,0,0,1) 0%, rgba(255,245,0,1) 50%, rgba(0,255,0,1) 100%)",
					transition: "width 1s ease 0s",
					width: attrs.percentageCompleted + "%",
					height: "100%",
				},
			}),
		)
	}
}

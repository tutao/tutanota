import m, { Children, Component, Vnode } from "mithril"
import { theme } from "./theme.js"

export interface CompletenessIndicatorAttrs {
	percentageCompleted: number
	width?: string
	class?: string
}

export class CompletenessIndicator implements Component<CompletenessIndicatorAttrs> {
	view({ attrs }: Vnode<CompletenessIndicatorAttrs>): Children {
		return m(
			"",
			{
				class: attrs.class,
				style: {
					border: `1px solid ${theme.content_button}`,
					width: attrs.width ?? "100px",
					height: "10px",
				},
			},
			m("", {
				style: {
					"background-color": theme.content_button,
					width: attrs.percentageCompleted + "%",
					height: "100%",
				},
			}),
		)
	}
}

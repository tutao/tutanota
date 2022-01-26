import m, {Children, Component, Vnode} from "mithril"
import {scaleToVisualPasswordStrength} from "../misc/passwords/PasswordUtils"
import {theme} from "./theme.js"

export interface CompletenessIndicatorAttrs {
	percentageCompleted: number
}

export class CompletenessIndicator implements Component<CompletenessIndicatorAttrs> {
	view({attrs}: Vnode<CompletenessIndicatorAttrs>): Children {
		return m(".mt-s",
			{
				style: {
					border: `1px solid ${theme.content_button}`,
					width: "100px",
					height: "10px",
				},
			},
			m("", {
				style: {
					"background-color": theme.content_button,
					width: scaleToVisualPasswordStrength(attrs.percentageCompleted) + "%",
					height: "100%",
				},
			}),
		)
	}
}
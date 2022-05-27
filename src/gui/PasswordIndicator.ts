import m, {Children, Component, Vnode} from "mithril"
import {scaleToVisualPasswordStrength} from "../misc/PasswordUtils"

export interface PasswordIndicatorAttrs {
	strength: number
}

export class PasswordIndicator implements Component<PasswordIndicatorAttrs> {
	view({attrs}: Vnode<PasswordIndicatorAttrs>): Children {
		return m(".password-indicator-border.mt-s",
			{
				style: {
					width: "100px",
					height: "10px",
				},
			},
			m(".password-indicator-bg", {
				style: {
					width: scaleToVisualPasswordStrength(attrs.strength) + "%",
					height: "100%",
				},
			}),
		)
	}
}
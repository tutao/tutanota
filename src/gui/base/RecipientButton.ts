import m, {Children, Component, Vnode} from "mithril"
import {px, size} from "../size"
import type {clickHandler} from "./GuiUtils"

export type Attrs = {
	label: string
	click: clickHandler
	style?: {}
}

export class RecipientButton implements Component<Attrs> {
	view({attrs}: Vnode<Attrs>): Children {
		return m(
			"button.mr-button.secondary.print.small",
			{
				style: Object.assign(
					{
						"white-space": "normal",
						"word-break": "break-all",
					},
					attrs.style,
				),
				onclick: (e: MouseEvent) => attrs.click(e, e.target as HTMLElement),
			},
			[attrs.label],
		)
	}
}
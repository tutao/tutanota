import m, { Children, Component, Vnode } from "mithril"
import type { ClickHandler } from "./GuiUtils"

export type Attrs = {
	label: string
	click: ClickHandler
	style?: object
}

export class RecipientButton implements Component<Attrs> {
	view({ attrs }: Vnode<Attrs>): Children {
		return m(
			"button.mr-8.content-accent-fg.print.small",
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

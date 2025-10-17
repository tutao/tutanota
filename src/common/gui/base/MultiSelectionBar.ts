import { Icons } from "./icons/Icons"
import m, { Children, Vnode } from "mithril"
import { IconButton } from "./IconButton.js"

interface MultiSelectionBarAttrs {
	selectNoneHandler: () => void
	text: string
}

export class MultiSelectionBar {
	view(vnode: Vnode<MultiSelectionBarAttrs>): Children {
		return m(
			".flex.items-center.justify-between.pl-4.pr-4",
			{
				style: {
					height: "100%",
				},
			},

			[
				m(IconButton, {
					title: "cancel_action",
					click: vnode.attrs.selectNoneHandler,
					icon: Icons.Cancel,
				}),
				m(".ml-8.b", vnode.attrs.text),
				vnode.children,
			],
		)
	}
}

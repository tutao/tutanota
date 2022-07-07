import {Icons} from "./icons/Icons"
import m, {Children, Vnode} from "mithril"
import {ButtonN} from "./ButtonN.js"

interface MultiSelectionBarAttrs {
	selectNoneHandler: () => void
	selectedEntiesLength: number
	children: Children
}

export class MultiSelectionBar {
	view(vnode: Vnode<MultiSelectionBarAttrs>): Children {
		return m(
			".flex.items-center.justify-between.pl-s.pr-s",
			{
				style: {
					height: "100%",
				},
			},

			[
				m(ButtonN, {
					label: "cancel_action",
					click: vnode.attrs.selectNoneHandler,
					icon: () => Icons.Cancel,
				}),
				m(".ml-s.b", vnode.attrs.selectedEntiesLength),
				vnode.attrs.children
			],
		)
	}
}
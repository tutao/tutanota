import {Icons} from "./icons/Icons"
import m from "mithril"
import {Button} from "./Button"
import type {Vnode} from "../../../flow/libs"


type MultiSelectionBarAttrs = {
	selectNoneHandler: () => void,
	selectedEntiesLength: number,
	content: Component
}

export class MultiSelectionBar {
	view(vnode: Vnode<MultiSelectionBarAttrs>) {
		const cancelButton = new Button("cancel_action", vnode.attrs.selectNoneHandler, () => Icons.Cancel)
		return m(".flex.items-center.justify-between.pl-s.pr-s", {
			style: {
				"height": "100%"
			}
		}, [
			m(cancelButton),
			m(".ml-s.b", vnode.attrs.selectedEntiesLength),
			m(vnode.attrs.content)
		])
	}
}
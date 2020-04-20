//@flow

import m from "mithril"
import {px, size} from "../size"

export type Attrs = {
	label: string,
	click: (e: Event, dom: HTMLElement) => mixed,
	style?: {},
}

export class RecipientButton implements MComponent<Attrs> {
	view({attrs}: Vnode<Attrs>): Children {
		return m("button.mr-button.secondary.print", {
			style: Object.assign({
				"white-space": "normal",
				"word-break": "break-all",
				"margin-top": px(size.vpad_small),
				"margin-bottom": px(size.vpad_small),
			}, attrs.style),
			onclick: (e) => attrs.click(e, e.target),
		}, [
			attrs.label,
		]);
	}
}
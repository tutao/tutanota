//@flow

import m from "mithril"
import {px, size} from "../size"

export type Attrs = {
	label: string,
	click: (e: Event, dom: HTMLElement) => mixed,
}

export class RecipientButton implements MComponent<Attrs> {
	view({attrs}: Vnode<Attrs>): Children {
		return m("button.mr-button.secondary", {
			style: {
				"white-space": "normal",
				"word-break": "break-all",
				"margin-top": px(size.vpad_small),
				"margin-bottom": px(size.vpad_small),
			},
			onclick: (e) => attrs.click(e, e.target),
		}, [
			attrs.label,
		]);
	}
}
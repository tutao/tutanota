import m, { Children, Component, Vnode } from "mithril"
import { assertNotNull } from "@tutao/tutanota-utils"

export type MonospaceTextDisplayAttrs = {
	text: string
	placeholder?: string
	chunkSize?: number
}

export class MonospaceTextDisplay implements Component<MonospaceTextDisplayAttrs> {
	view(vnode: Vnode<MonospaceTextDisplayAttrs>): Children {
		const { text, placeholder, chunkSize } = vnode.attrs

		let formattedText: string
		if (chunkSize !== undefined && text !== "") {
			formattedText = assertNotNull(text.match(new RegExp(`.{${chunkSize}}`, "g"))).join(" ")
		} else {
			formattedText = text
		}

		// Display `formattedText` unless it is empty and a placeholder is given
		const contents = formattedText != "" ? formattedText : placeholder !== undefined ? placeholder : ""

		return m(".text-break.monospace.selectable.flex.flex-wrap.border.pt.pb.plr", contents)
	}
}

import m, { Children, Component, Vnode } from "mithril"
import { assertNotNull } from "@tutao/tutanota-utils"

export type MonospaceTextDisplayAttrs = {
	text: string
	placeholder?: string
	chunkSize?: number
	border?: boolean
	classes?: string
}

export class MonospaceTextDisplay implements Component<MonospaceTextDisplayAttrs> {
	view(vnode: Vnode<MonospaceTextDisplayAttrs>): Children {
		const { text, placeholder, chunkSize, classes } = vnode.attrs
		const border = vnode.attrs.border ?? true

		let splitText: string = ""
		if (chunkSize !== undefined && text !== "") {
			const formattedText = assertNotNull(text.match(new RegExp(`.{${chunkSize}}`, "g"))).join(" ")
			const chunks = formattedText.split(" ")
			let chunkProcessed = 0

			for (let i = 0; i < chunks.length; i++) {
				if (chunkProcessed === 4) {
					chunkProcessed = 0
					splitText += "\n"
				}
				const currentChunk = chunks[i]
				if (chunkProcessed > 0) {
					splitText = `${splitText} ${currentChunk}`
				} else {
					splitText = `${splitText}${currentChunk}`
				}

				chunkProcessed += 1
			}
		} else {
			splitText = text
		}

		let extraClasses = classes ?? ""

		if (border) {
			extraClasses += ".border.pt.pb.plr"
		}

		// Display `formattedText` unless it is empty and a placeholder is given
		const contents = splitText != "" ? splitText : placeholder !== undefined ? placeholder : ""

		return m("pre.text-break.monospace.selectable.flex.flex-wrap.flex-center" + extraClasses, contents)
	}
}

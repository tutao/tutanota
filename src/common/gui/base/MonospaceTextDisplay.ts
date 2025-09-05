import m, { Children, Component, Vnode } from "mithril"
import { assertNotNull } from "@tutao/tutanota-utils"

export type MonospaceTextDisplayAttrs = {
	text: string
	placeholder?: string
	chunkSize?: number
	chunksPerLine?: number
	border?: boolean
	classes?: string
}

/**
 * Useful for displaying technical pieces of data, e.g. the recovery code or key fingerprints.
 */
export class MonospaceTextDisplay implements Component<MonospaceTextDisplayAttrs> {
	view(vnode: Vnode<MonospaceTextDisplayAttrs>): Children {
		const { text, placeholder, chunkSize, classes } = vnode.attrs
		const chunksPerLine = vnode.attrs.chunksPerLine || 4 // 0 makes no sense
		const border = vnode.attrs.border ?? true

		let splitText: string = ""
		if (chunkSize !== undefined && text !== "") {
			const formattedText = assertNotNull(text.match(new RegExp(`.{${chunkSize}}`, "g"))).join(" ")
			const chunks = formattedText.split(" ")

			for (let i = 0; i < chunks.length; i++) {
				const currentChunk = chunks[i]
				const isFirstChunk = i === 0
				const separator = i % chunksPerLine === 0 ? "\n" : " "
				splitText = `${splitText}${isFirstChunk ? "" : separator}${currentChunk}`
			}
		} else {
			splitText = text
		}

		let extraClasses = classes ?? ""

		if (border) {
			extraClasses += ".border.pt-16.pb-16.plr-12"
		}

		// in case the chunkSize parameter is set we want to preserve the line break to display the monospace content in multiple rows.
		if (chunkSize) {
			extraClasses += ".text-pre"
		}

		// Display `formattedText` unless it is empty and a placeholder is given
		const contents = splitText !== "" ? splitText : placeholder !== undefined ? placeholder : ""

		return m(".text-break.monospace.selectable.flex.flex-wrap.flex-center" + extraClasses, { "data-testid": "monoTextContent" }, contents)
	}
}

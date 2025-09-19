import m, { Children, Component, Vnode } from "mithril"
import { lang } from "../../misc/LanguageViewModel"
import { assertNotNull } from "@tutao/tutanota-utils"
import { px, size } from "../../gui/size.js"

export const GIFT_CARD_MESSAGE_COLS = 26
const GIFT_CARD_MESSAGE_HEIGHT = 5
type GiftCardMessageEditorFieldAttrs = {
	message: string
	onMessageChanged: (message: string) => void
	cols?: number
	rows?: number
}
/**
 * A text area that allows you to edit some text that is limited to fit within a certain rows/columns boundary
 */
export class GiftCardMessageEditorField implements Component<GiftCardMessageEditorFieldAttrs> {
	private textAreaDom: HTMLTextAreaElement | null = null
	private isActive: boolean = false

	view(vnode: Vnode<GiftCardMessageEditorFieldAttrs>): Children {
		const a = vnode.attrs
		return m("label.small.mt-24.i.flex-center.flex-column", [
			// Cannot wrap the label in a span to apply the `small` class as it will break screen readers
			lang.get("yourMessage_label"),
			m("textarea.monospace.normal-font-size.overflow-hidden.resize-none" + (this.isActive ? ".editor-border-active" : ".editor-border"), {
				wrap: "hard",
				cols: a.cols || GIFT_CARD_MESSAGE_COLS,
				rows: a.rows || GIFT_CARD_MESSAGE_HEIGHT,
				oncreate: (vnode) => {
					this.textAreaDom = vnode.dom as HTMLTextAreaElement
					this.textAreaDom.value = a.message
				},
				onfocus: () => {
					this.isActive = true
				},
				onblur: () => {
					this.isActive = false
				},
				oninput: () => {
					const textAreaDom = assertNotNull(this.textAreaDom)
					const origStart = textAreaDom.selectionStart
					const origEnd = textAreaDom.selectionEnd

					// remove characters from the end
					while (textAreaDom.clientHeight < textAreaDom.scrollHeight) {
						textAreaDom.value = textAreaDom.value.substring(0, textAreaDom.value.length - 1)
					}

					a.onMessageChanged(textAreaDom.value)

					// the cursor gets pushed to the end when we chew up tailing characters, so we put it back where it started in that case
					if (textAreaDom.selectionStart - origStart > 1) {
						textAreaDom.selectionStart = origStart
						textAreaDom.selectionEnd = origEnd
					}
				},
			}),
		])
	}
}

//@flow
import m from "mithril"
import {lang} from "../../misc/LanguageViewModel"

const GIFT_CARD_MESSAGE_COLS = 26
const GIFT_CARD_MESSAGE_HEIGHT = 5
type GiftCardMessageEditorFieldAttrs = {
	message: Stream<string>,
	cols?: number,
	rows?: number
}

/**
 * A text area that allows you to edit some text that is limited to fit within a certain rows/columns boundary
 */
export class GiftCardMessageEditorField implements MComponent<GiftCardMessageEditorFieldAttrs> {
	textAreaDom: HTMLTextAreaElement
	isActive: boolean = false

	view(vnode: Vnode<GiftCardMessageEditorFieldAttrs>): Children {
		const a = vnode.attrs
		return m("", [
				m(".small.mt-form.i", lang.get("yourMessage_label")),
				m("textarea.monospace.center.overflow-hidden.resize-none" + (this.isActive ? ".editor-border-active" : ".editor-border"), {
						wrap: "hard",
						cols: a.cols || GIFT_CARD_MESSAGE_COLS,
						rows: a.rows || GIFT_CARD_MESSAGE_HEIGHT,
						oncreate: vnode => {
							this.textAreaDom = vnode.dom
							this.textAreaDom.value = a.message()
						},
						onfocus: () => {
							this.isActive = true
						},
						onblur: () => {
							this.isActive = false
						},
						oninput: e => {
							const origStart = this.textAreaDom.selectionStart
							const origEnd = this.textAreaDom.selectionEnd
							// remove characters from the end
							while (this.textAreaDom.clientHeight < this.textAreaDom.scrollHeight) {
								this.textAreaDom.value = this.textAreaDom.value.substr(0, this.textAreaDom.value.length - 1)
							}
							a.message(this.textAreaDom.value)
							// the cursor gets pushed to the end when we chew up tailing characters so we put it back where it started in that case
							if (this.textAreaDom.selectionStart - origStart > 1) {
								this.textAreaDom.selectionStart = origStart
								this.textAreaDom.selectionEnd = origEnd
							}
						}
					}
				)
			]
		)
	}
}
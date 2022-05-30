import m, {Children, ClassComponent, Vnode} from "mithril"
import {TextFieldN} from "./TextFieldN"
import {TranslationText} from "../../misc/LanguageViewModel"
import {ButtonN, ButtonType} from "./ButtonN"
import {Keys} from "../../api/common/TutanotaConstants"
import {attachDropdown, DropdownChildAttrs} from "./DropdownN"

export interface BubbleTextFieldAttrs {
	label: TranslationText
	items: Array<string>
	renderBubbleText: (item: string) => string
	getBubbleDropdownAttrs: (item: string) => Promise<DropdownChildAttrs[]>
	text: string
	onInput: (text: string) => void
	onBackspace: () => boolean
	onEnterKey: () => boolean
	onUpKey: () => boolean
	onDownKey: () => boolean
	disabled: boolean
	injectionsRight?: Children | null
	onBlur: () => void
}

export class BubbleTextField implements ClassComponent<BubbleTextFieldAttrs> {
	private active: boolean = false
	private domInput: HTMLInputElement | null = null

	view({attrs}: Vnode<BubbleTextFieldAttrs>) {
		return m(".bubble-text-field", [
			m(TextFieldN, {
				label: attrs.label,
				disabled: attrs.disabled,
				value: attrs.text,
				oninput: attrs.onInput,
				injectionsLeft: () => {
					return attrs.items.map((item, idx, items) => {
						// We need overflow: hidden on both so that ellipsis on button works.
						// flex is for reserving space for the comma. align-items: end so that comma is pushed to the bottom.
						return m(".flex.overflow-hidden.items-end", [
							m(".flex-no-grow-shrink-auto.overflow-hidden",
								m(ButtonN,
									attachDropdown({
										mainButtonAttrs: {
											label: () => attrs.renderBubbleText(item),
											type: ButtonType.TextBubble,
											isSelected: () => false,
										},
										childAttrs: () => attrs.getBubbleDropdownAttrs(item),
										width: 250
									})
								)
							),
							// Comma is shown when there's text/another bubble afterwards or if the field is active
							this.active || idx < items.length - 1 || attrs.text !== "" ? m("span.pr", ",") : null,
						])
					})
				},
				injectionsRight: () => attrs.injectionsRight ?? null,
				oncreate: vnode => {
					// If the field is initialized with bubbles but the user did not edit it yet then field will not have correct size
					// and last bubble will not be on the same line with right injections (like "show" button). It is fixed after user
					// edits the field and autocompletion changes the field but before that it's broken. To avoid it we set the size
					// manually.
					//
					// This oncreate is run before the dom input's oncreate is run and sets the field so we have to access input on the
					// next frame. There's no other callback to use without requesting redraw.
					requestAnimationFrame(() => {
						if (this.domInput) this.domInput.size = 1
					})
				},
				onDomInputCreated: dom => this.domInput = dom,
				onfocus: () => {
					this.active = true
				},
				onblur: () => {
					this.active = false
					attrs.onBlur()
				},
				keyHandler: key => {
					switch (key.keyCode) {
						case Keys.BACKSPACE.code:
							return attrs.onBackspace()

						case Keys.RETURN.code:
							return attrs.onEnterKey()

						case Keys.DOWN.code:
							return attrs.onUpKey()

						case Keys.UP.code:
							return attrs.onDownKey()
					}
					return true
				}
			}),
		])
	}
}
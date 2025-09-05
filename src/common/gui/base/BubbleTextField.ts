import m, { Children, ClassComponent, Vnode } from "mithril"
import { Autocomplete, TextField, TextFieldType } from "./TextField.js"
import { MaybeTranslation, Translation } from "../../misc/LanguageViewModel"
import { Keys } from "../../api/common/TutanotaConstants"
import { createAsyncDropdown, DropdownChildAttrs } from "./Dropdown.js"
import { lazy } from "@tutao/tutanota-utils"
import { BaseButton, BaseButtonAttrs } from "./buttons/BaseButton.js"

export enum BubbleTextFieldClickBehaviour {
	SHOW_DROPDOWN,
	SKIP_DROPDOWN,
}

export interface BubbleTextFieldAttrs<T> {
	label: MaybeTranslation
	items: ReadonlyArray<T>
	renderBubbleText: (item: T) => Translation
	getBubbleIcon: (item: T) => Children
	getBubbleDropdownAttrs: (item: T) => Promise<DropdownChildAttrs[]>
	text: string
	onInput: (text: string) => void
	onBackspace: () => boolean
	onEnterKey: () => boolean
	onUpKey: () => boolean
	onDownKey: () => boolean
	disabled: boolean
	injectionsRight?: Children | null
	onFocus: () => void
	onBlur: () => void
	helpLabel?: lazy<Children> | null
	onClick?: (item: T) => BubbleTextFieldClickBehaviour
}

export class BubbleTextField<T> implements ClassComponent<BubbleTextFieldAttrs<T>> {
	private active: boolean = false
	private domInput: HTMLInputElement | null = null

	view({ attrs }: Vnode<BubbleTextFieldAttrs<T>>) {
		return m(".bubble-text-field", [
			m(TextField, {
				label: attrs.label,
				disabled: attrs.disabled,
				value: attrs.text,
				oninput: attrs.onInput,
				helpLabel: attrs.helpLabel,
				type: TextFieldType.Email,
				autocompleteAs: Autocomplete.off,
				injectionsLeft: () => {
					return attrs.items.map((item, idx, items) => {
						// We need overflow: hidden on both so that ellipsis on button works.
						// flex is for reserving space for the comma. align-items: end so that comma is pushed to the bottom.
						const bubbleText = attrs.renderBubbleText(item)
						const bubbleIcon = attrs.getBubbleIcon(item)

						const baseButtonAttrs: BaseButtonAttrs = {
							label: bubbleText,
							text: bubbleText.text,
							class: "text-bubble button-content content-fg text-ellipsis flash",
							style: {
								"max-width": "100%",
							},
							onclick: (e: MouseEvent) => {
								e.stopPropagation() // do not focus the text field
								// if a onclick event have been registered it takes precedence over the dropdown
								// behaviour below, this is necessary for the display of the recover dialog when
								// there is a VERIFICATION ERROR
								let showDropdown = true

								if (attrs.onClick) {
									if (attrs.onClick(item) === BubbleTextFieldClickBehaviour.SKIP_DROPDOWN) {
										showDropdown = false
									}
								}

								if (showDropdown) {
									createAsyncDropdown({
										lazyButtons: () => attrs.getBubbleDropdownAttrs(item),
										width: 250,
									})(e, e.target as HTMLElement)
								}
							},
						}
						if (bubbleIcon) {
							baseButtonAttrs.icon = bubbleIcon
						}

						return m(".flex.overflow-hidden.items-end", [
							m(".flex-no-grow-shrink-auto.overflow-hidden", m(BaseButton, baseButtonAttrs)),
							// Comma is shown when there's text/another bubble afterwards or if the field is active
							this.active || idx < items.length - 1 || attrs.text !== "" ? m("span.pr-12", ",") : null,
						])
					})
				},
				injectionsRight: () => attrs.injectionsRight ?? null,
				oncreate: () => {
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
				onDomInputCreated: (dom) => (this.domInput = dom),
				onfocus: () => {
					this.active = true
					attrs.onFocus()
				},
				onblur: () => {
					this.active = false
					attrs.onBlur()
				},
				keyHandler: (key) => {
					if (key.key != null) {
						switch (key.key.toLowerCase()) {
							case Keys.BACKSPACE.code:
								return attrs.onBackspace()

							case Keys.RETURN.code:
								return attrs.onEnterKey()

							case Keys.DOWN.code:
								return attrs.onUpKey()

							case Keys.UP.code:
								return attrs.onDownKey()
						}
					}
					return true
				},
			}),
		])
	}
}

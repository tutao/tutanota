import m, { ClassComponent, Vnode, VnodeDOM } from "mithril"
import { Select, SelectAttributes, SelectOption, SelectState } from "../../../../common/gui/base/Select.js"
import { Keys, TabIndex } from "../../../../common/api/common/TutanotaConstants.js"
import { SingleLineTextField } from "../../../../common/gui/base/SingleLineTextField.js"
import { debounceStart, getFirstOrThrow } from "@tutao/tutanota-utils"
import { Dialog } from "../../../../common/gui/base/Dialog.js"
import { lang, TranslationKey } from "../../../../common/misc/LanguageViewModel.js"
import { parseMailAddress, parsePastedInput, parseTypedInput } from "../../../../common/gui/MailRecipientsTextField.js"
import { Contact } from "../../../../common/api/entities/tutanota/TypeRefs.js"
import { RecipientSearchResultItem, RecipientsSearchModel } from "../../../../common/misc/RecipientsSearchModel.js"
import stream from "mithril/stream"
import { theme } from "../../../../common/gui/theme.js"
import { Icons } from "../../../../common/gui/base/icons/Icons.js"
import { Icon } from "../../../../common/gui/base/Icon.js"
import { px, size } from "../../../../common/gui/size.js"
import { DefaultAnimationTime } from "../../../../common/gui/animation/Animations.js"
import { TextFieldType } from "../../../../common/gui/base/TextField.js"
import { keyboardEventToKeyPress } from "../../../../common/misc/KeyManager.js"

export interface GuestPickerAttrs {
	ariaLabel: TranslationKey
	onRecipientAdded: (address: string, name: string | null, contact: Contact | null) => void
	disabled: boolean
	search: RecipientsSearchModel
}

interface GuestItem extends SelectOption<RecipientSearchResultItem> {
	name: string
	address?: string
	type: string
}

export class GuestPicker implements ClassComponent<GuestPickerAttrs> {
	private isExpanded: boolean = false
	private isFocused: boolean = false
	private value: string = ""
	private selected?: GuestItem
	private options: stream<Array<GuestItem>> = stream([])
	private selectDOM: VnodeDOM<SelectAttributes<GuestItem, RecipientSearchResultItem>> | null = null

	view({ attrs }: Vnode<GuestPickerAttrs>) {
		return m(Select<GuestItem, RecipientSearchResultItem>, {
			classes: ["flex-grow"],
			dropdownPosition: "bottom",
			onchange: ({ value: guest }) => {
				this.handleSelection(attrs, guest)
			},
			onclose: () => {
				this.isExpanded = false
			},
			oncreate: (node: VnodeDOM<SelectAttributes<GuestItem, RecipientSearchResultItem>>) => {
				this.selectDOM = node
			},
			selected: this.selected,
			ariaLabel: attrs.ariaLabel,
			disabled: attrs.disabled,
			options: this.options,
			noIcon: true,
			expanded: true,
			tabIndex: Number(TabIndex.Programmatic),
			placeholder: this.renderSearchInput(attrs),
			renderDisplay: () => this.renderSearchInput(attrs),
			renderOption: (option) => this.renderSuggestionItem(option),
		} satisfies SelectAttributes<GuestItem, RecipientSearchResultItem>)
	}

	private renderSuggestionItem(option: GuestItem) {
		const firstRow =
			option.value.type === "recipient"
				? option.value.value.name
				: m(Icon, {
						icon: Icons.People,
						style: {
							fill: theme.on_surface,
							"aria-describedby": lang.get("contactListName_label"),
						},
					})
		const secondRow = option.value.type === "recipient" ? option.value.value.address : option.value.value.name
		return m(
			"button.pt-8.pb-8.click.content-hover.state-bg.button-min-height.flex.col",
			{
				style: {
					"padding-left": px(size.spacing_24),
				},
			},
			[m("span.small.full-width.text-ellipsis.box-content", firstRow), m("span.name.full-width.text-ellipsis.box-content", secondRow)],
		)
	}

	private async handleSelection(attrs: GuestPickerAttrs, guest: RecipientSearchResultItem) {
		if (guest.value != null) {
			if (guest.type === "recipient") {
				const { address, name, contact } = guest.value
				attrs.onRecipientAdded(address, name, contact)
				attrs.search.clear()
				this.value = ""
			} else {
				this.value = ""
				const recipients = await attrs.search.resolveContactList(guest.value)
				for (const { address, name, contact } of recipients) {
					attrs.onRecipientAdded(address, name, contact)
				}
				attrs.search.clear()
				m.redraw()
			}
		}
	}

	private renderSearchInput(attrs: GuestPickerAttrs) {
		return m(SingleLineTextField, {
			classes: ["height-100p"],
			value: this.value,
			placeholder: lang.get("addGuest_label"),
			onclick: (e: MouseEvent) => {
				e.stopImmediatePropagation()
				if (!this.isExpanded && this.value.length > 0 && this.selectDOM) {
					;(this.selectDOM.dom as HTMLElement).click()
					this.isExpanded = true
				}
			},
			oninput: (val: string) => {
				if (val.length > 0 && !this.isExpanded && this.selectDOM) {
					;(this.selectDOM.dom as HTMLElement).click()
					this.isExpanded = true
				}

				// if the new text length is more than one character longer,
				// it means the user pasted the text in, so we want to try and resolve a list of contacts
				const { remainingText, newRecipients, errors } = val.length - this.value.length > 1 ? parsePastedInput(val) : parseTypedInput(val)

				for (const { address, name } of newRecipients) {
					attrs.onRecipientAdded(address, name, null)
				}

				if (errors.length === 1 && newRecipients.length === 0) {
					// if there was a single recipient and it was invalid then just pretend nothing happened
					this.value = getFirstOrThrow(errors)
				} else {
					if (errors.length > 0) {
						Dialog.message(lang.makeTranslation("error_message", `${lang.get("invalidPastedRecipients_msg")}\n\n${errors.join("\n")}`))
					}
					this.value = remainingText
				}

				this.doSearch(val, attrs)
			},
			disabled: attrs.disabled,
			ariaLabel: attrs.ariaLabel,
			onfocus: (event: FocusEvent) => {
				this.isFocused = true
			},
			onblur: (e: any) => {
				if (this.isFocused) {
					this.resolveInput(attrs, false)
					this.isFocused = false
				}

				e.redraw = false
			},
			onkeydown: (event: KeyboardEvent) => this.handleKeyDown(event, attrs),
			type: TextFieldType.Text,
		})
	}

	private handleKeyDown(event: KeyboardEvent, attrs: GuestPickerAttrs) {
		const keyPress = keyboardEventToKeyPress(event)

		if (keyPress.key.toLowerCase() === Keys.RETURN.code) {
			this.resolveInput(attrs, true)
		}

		return true
	}

	private doSearch = debounceStart(DefaultAnimationTime, (val: string, attrs: GuestPickerAttrs) => {
		attrs.search.search(val).then(() => {
			const searchResult = attrs.search.results()

			if (searchResult.length === 0) {
				this.selected = undefined
			}

			this.options(
				searchResult.map((option) => ({
					name: option.value.name,
					value: option,
					type: option.type,
					ariaValue: option.value.name,
				})),
			)

			m.redraw()
		})
	})

	private async selectSuggestion(attrs: GuestPickerAttrs) {
		if (this.selected == null) {
			return
		}

		if (this.selected.value.type === "recipient") {
			const { address, name, contact } = this.selected.value.value
			attrs.onRecipientAdded(address, name, contact)
			attrs.search.clear()
			this.value = ""
		} else {
			attrs.search.clear()
			this.value = ""
			const recipients = await attrs.search.resolveContactList(this.selected.value.value)
			for (const { address, name, contact } of recipients) {
				attrs.onRecipientAdded(address, name, contact)
			}
			m.redraw()
		}

		this.closePicker()
	}

	/**
	 * Resolves a typed in mail address or one of the suggested ones.
	 * @param attrs
	 * @param selectSuggestion boolean value indicating whether a suggestion should be selected or not. Should be true if a suggestion is explicitly selected by
	 * for example hitting the enter key and false e.g. if the dialog is closed
	 */
	private resolveInput(attrs: GuestPickerAttrs, selectSuggestion: boolean) {
		const suggestions = attrs.search.results()
		if (suggestions.length > 0 && selectSuggestion) {
			this.selectSuggestion(attrs)
		} else {
			const parsed = parseMailAddress(this.value)
			if (parsed != null) {
				attrs.onRecipientAdded(parsed.address, parsed.name, null)
				this.value = ""
				this.closePicker()
			}
		}
	}

	private closePicker() {
		if (this.selectDOM) {
			;(this.selectDOM.state as SelectState).dropdownContainer?.onClose()
		}
	}
}
